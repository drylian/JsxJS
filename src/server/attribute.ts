import { DOM } from "./render";
import type { DOMAttributes, DOMNode } from "./types";
import { random } from "./utils";

/**
 * Base interface for attribute handlers
 */
interface AttributeHandlerBase {
    key: string;
}

/**
 * Interface for static attribute handlers (server-side rendering)
 */
interface StaticAttributeHandler extends AttributeHandlerBase {
    /**
     * Handles static attribute rendering
     * @param attribute - The attribute being processed
     * @param attributes - All attributes of the element
     * @param html_fragments - Array to accumulate HTML fragments
     * @returns Object containing HTML, scripts, and lock status
     */
    static: (
        attribute: { key: string; id: string; value: unknown },
        attributes: DOMAttributes,
        html_fragments: string[]
    ) => {
        html?: string;
        lockchildren?: boolean;
        scripts?: DOMNode[];
    };
}

/**
 * Interface for DOM attribute handlers (client-side rendering)
 */
interface DomAttributeHandler extends AttributeHandlerBase {
    /**
     * Handles DOM attribute rendering
     * @param attribute - The attribute being processed
     * @param attributes - All attributes of the element
     * @param fragments - Object containing current element and code fragments
     * @returns Object containing attribute code, scripts, and lock status
     */
    dom: (
        attribute: { key: string; value: unknown; currentElement: string },
        attributes: DOMAttributes,
        fragments: { currentElement: string; fragments: string[] }
    ) => {
        attributes?: string;
        scripts?: string[];
        lockchildren?: boolean;
    };
}

/**
 * Combined type for attribute handlers
 */
type AttributeHandler = StaticAttributeHandler & DomAttributeHandler;

/**
 * Class for handling attribute rendering in both static and DOM contexts
 */
export class AttributeRender {
    /**
     * Collection of registered attribute handlers
     */
    public static attributes: AttributeHandler[] = [];

    /**
     * Creates a new attribute handler
     * @param opts - The attribute handler configuration
     */
    constructor(opts: AttributeHandler) {
        AttributeRender.attributes.push(opts);
    }

    /**
     * Renders attributes for static HTML generation
     * @param props - The element attributes/properties
     * @param html_fragments - Array to accumulate HTML fragments
     * @returns Object containing attributes string, scripts, and lock status
     */
    public static async render_static(
        props: DOMAttributes,
        html_fragments: string[] = []
    ): Promise<{
        attributes: string;
        scripts: DOMNode[];
        lockchildren: boolean;
    }> {
        let scripts: DOMNode[] = [];
        let lockchildren = false;
        const generatedId = props?.id ?? random(16);
        const attributeParts: string[] = [];

        // Filter out children and props from attributes
        const items = Object.entries(props).filter(
            ([key]) => !["children", "props"].includes(key)
        );

        // Process each attribute
        for (const [key, value] of items) {
            const resolvedValue = value instanceof Promise ? await value : value;
            const handler = this.attributes.find(
                (h) =>
                    h.key === key ||
                    (h.key.endsWith("*") && key.startsWith(h.key.slice(0, -1)))
            );

            // Handle with custom handler if available
            if (handler && handler.static) {
                const result = await handler.static(
                    { key, value: resolvedValue, id: generatedId },
                    props,
                    html_fragments
                );

                if (result?.scripts) {
                    scripts.push(...result.scripts);
                }
                if (result?.lockchildren) {
                    lockchildren = true;
                }
                attributeParts.push(result?.html ?? "");
                continue;
            }

            // Handle boolean attributes
            if (resolvedValue === true) {
                attributeParts.push(key);
                continue;
            }
            if (resolvedValue === false || resolvedValue == null) {
                continue;
            }

            // Handle regular string attributes
            attributeParts.push(
                ` ${key}="${String(resolvedValue).replace(/"/g, "&quot;")}"`
            );
        }

        let attributes = attributeParts.filter(Boolean).join(" ");

        // Ensure element has ID if it has scripts
        if (scripts.length > 0 && !props?.id) {
            attributes += ` id="${generatedId}"`;
        }

        // Combine and process scripts
        if (scripts.length) {
            const strings = scripts.filter((s) => typeof s === "string");
            const doms = scripts.filter((s) => typeof s !== "string") as DOMNode[];

            if (strings.length > 0) {
                const combinedScript = DOM.createElement(
                    "script",
                    null,
                    strings.join("")
                );
                doms.push(combinedScript);
            }
            scripts = doms;
        }

        return {
            attributes: attributes.trim(),
            scripts,
            lockchildren,
        };
    }

    /**
     * Renders attributes for client-side DOM generation
     * @param props - The element attributes/properties
     * @param fragments - Object containing current element and code fragments
     * @returns Object containing code fragments and lock status
     */
    public static async render_dom(
        props: DOMAttributes,
        fragments: { currentElement: string; fragments: string[] }
    ): Promise<{
        fragments: string[];
        lockchildren: boolean;
    }> {
        let lockchildren = false;
        const generatedId = props?.id ?? random(16);

        // Filter out children and props from attributes
        const items = Object.entries(props).filter(
            ([key]) => !["children", "props"].includes(key)
        );

        // Process each attribute
        for (const [key, value] of items) {
            const resolvedValue = value instanceof Promise ? await value : value;
            const handler = this.attributes.find(
                (h) =>
                    h.key === key ||
                    (h.key.endsWith("*") && key.startsWith(h.key.slice(0, -1)))
            );

            // Handle with custom handler if available
            if (handler && handler.dom) {
                const result = await handler.dom(
                    {
                        key,
                        value: resolvedValue,
                        currentElement: fragments.currentElement,
                    },
                    props,
                    fragments
                );

                if (result?.scripts) {
                    fragments.fragments.push(...result.scripts);
                }
                if (result?.lockchildren) {
                    lockchildren = true;
                }
                continue;
            }

            // Skip falsey values
            if (resolvedValue === false || resolvedValue == null) {
                continue;
            }

            // Handle regular attributes
            const attrValue = typeof resolvedValue === "string"
                ? resolvedValue.replace(/"/g, '\\"')
                : String(resolvedValue);
            fragments.fragments.push(
                `${fragments.currentElement}.setAttribute("${key}", "${attrValue}");`
            );
        }

        return {
            fragments: fragments.fragments,
            lockchildren,
        };
    }
}