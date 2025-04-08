import { DOM } from "./render";
import type { DOMAttributes, DOMNode } from "./types";
import { random } from "./utils";

interface AttributeHandler {
    key: string;
    action: (
        attribute: { key: string, id: string, value: unknown },
        attributes: DOMAttributes,
        html_fragments: string[],
    ) => {
        html?: string;
        lockchildren?: boolean;
        scripts?: DOMNode[];
    };
}

export class AttributeRender {
    public static attributes: AttributeHandler[] = [];
    constructor(opts: AttributeHandler) {
        AttributeRender.attributes.push(opts);
    }
    public static async render(props: DOMAttributes, html_fragments: string[]) {
        // Initialize variables
        let scripts: DOMNode[] = [];
        let lockchildren = false;
        const generatedId = props?.id ?? random(16);
        const attributeParts: string[] = [];
        
        // Filter out special properties
        const items = Object.entries(props)
            .filter(([key]) => !['children', 'props'].includes(key));
        
        // Process all attributes sequentially
        for (const [key, value] of items) {
            // Await if value is a Promise
            const resolvedValue = value instanceof Promise ? await value : value;
            
            // Find matching attribute handler
            const handler = this.attributes.find(h => 
                h.key === key || 
                (h.key.endsWith('*') && key.startsWith(h.key.slice(0, -1)))
            );
            
            // Handle with custom handler if found
            if (handler) {
                const result = await handler.action(
                    { key, value: resolvedValue, id: generatedId }, 
                    props, 
                    html_fragments
                );
                
                // Update state from handler result
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
            
            // Default attribute handling
            attributeParts.push(` ${key}="${String(resolvedValue).replace(/"/g, '&quot;')}"`);
        }
        
        // Join all attribute parts
        let attributes = attributeParts.filter(Boolean).join(' ');
        
        // Add auto-generated ID if needed
        if (scripts?.length > 0 && !props?.id) {
            attributes += ` id="${generatedId}"`;
        }

        if (scripts.length) {
            const strings = scripts.filter(s => typeof s === 'string');
            const doms = scripts.filter(s => typeof s !== 'string') as DOMNode[];
            
            // Handle string scripts
            if (strings.length > 0) {
                const combinedScript = DOM.createElement("script", null, strings.join(""));
                doms.push(combinedScript);
            }
            scripts.length = 0;
            scripts.push(...doms);
        }
    
        return { 
            attributes: attributes.trim(), 
            scripts: scripts || [], 
            lockchildren 
        };
    }
}