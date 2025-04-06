import { type DOMNode, type PrimitiveNode, type FunctionComponent, type DOMAttributes } from './types';

/**
 * DOM UTILITIES
 * Collection of helper functions for DOM manipulation and rendering
 */

/**
 * Checks if a node is a primitive type (string, number, boolean, null, or undefined)
 */
const isPrimitiveNode = (node: unknown): node is PrimitiveNode => (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    node === null ||
    node === undefined
);

/**
 * Checks if a node is valid (not null, undefined, or false)
 */
const isValidNode = (node: unknown): boolean => (
    node !== null && node !== undefined && node !== false
);

/**
 * Checks if an HTML element type is a void element (self-closing)
 */
const isVoidElement = (type: string): boolean => {
    const voidElements = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr',
        'img', 'input', 'link', 'meta', 'param',
        'source', 'track', 'wbr'
    ]);
    return voidElements.has(type);
};

/**
 * FUNCTION ANALYSIS UTILITIES
 * Functions for parsing and extracting information from functions
 */

interface FunctionAnalysis {
    body: string;
    params: string[];
    isAsync: boolean;
}

/**
 * Extracts the body, parameters, and async status from a function
 * @param fn The function to analyze
 * @returns Object containing function body, parameters, and async status
 */
function extractFunctionWithParams(fn: Function): FunctionAnalysis {
    const fnString = fn.toString().trim();
    let body = '';
    let params: string[] = [];
    const isAsync = fnString.startsWith('async');

    // Patterns for different function formats
    const patterns = [
        // Arrow functions: (a, b) => { ... } or a => { ... }
        {
            regex: /^(?:async\s*)?\(?([^)]*)\)?\s*=>\s*{?([\s\S]*?)}?\s*$/,
            processor: (match: RegExpMatchArray) => {
                params = match[1]!.split(',').map(p => p.trim()).filter(Boolean);
                return match[2]!.trim();
            }
        },
        // Function declarations: function(a, b) { ... }
        {
            regex: /^(?:async\s+)?function\s*\w*\s*\(([^)]*)\)\s*{([\s\S]*?)}\s*$/,
            processor: (match: RegExpMatchArray) => {
                params = match[1]!.split(',').map(p => p.trim()).filter(Boolean);
                return match[2]!.trim();
            }
        },
        // Method shorthand: { method(a, b) { ... } }
        {
            regex: /^\w+\s*\(([^)]*)\)\s*{([\s\S]*?)}\s*$/,
            processor: (match: RegExpMatchArray) => {
                params = match[1]!.split(',').map(p => p.trim()).filter(Boolean);
                return match[2]!.trim();
            }
        }
    ];

    // Try to match known function patterns
    for (const { regex, processor } of patterns) {
        const match = fnString.match(regex);
        if (match) {
            body = processor(match);
            break;
        }
    }

    // Fallback for unrecognized function formats
    if (!body) {
        console.warn('Function pattern not recognized, using fallback extraction');
        body = fnString
            .replace(/^(?:async\s*)?(?:function\s*\w*\s*\([^)]*\)|\([^)]*\)\s*=>)\s*{?/, '')
            .replace(/}\s*$/, '')
            .trim();

        // Attempt to extract parameters in fallback
        const paramsMatch = fnString.match(/\((.*?)\)/);
        if (paramsMatch) {
            params = paramsMatch[1]!.split(',').map(p => p.trim()).filter(Boolean);
        }
    }

    // Handle single-expression arrow functions
    if (!body.startsWith('{') && !body.includes('return')) {
        body = `${body}\nreturn;`;
    }

    // Clean up extra braces and whitespace
    body = body.replace(/^\{/, '').replace(/\}$/, '').trim();

    return { body, params, isAsync };
}

/**
 * Serializes function parameters safely, handling complex objects
 * @param params Array of parameter names
 * @param props Props object containing parameter values
 * @returns Serialized parameter declarations as a string
 */
function serializeParams(params: string[], props: object): string {
    return params.map((param, index) => {
        if (index === 0) return param; // First parameter is always the DOM element

        // Handle destructured object parameters
        if (param.startsWith('{') && param.endsWith('}')) {
            const propName = param.slice(1, -1).trim();
            return `const ${propName} = JSON.parse('${JSON.stringify(props[propName as keyof typeof props] || {})}');`;
        }

        // Handle regular parameters
        return `const ${param} = ${JSON.stringify(props[param as keyof typeof props] || null)};`;
    }).join('\n');
}

/**
 * RENDERER UTILITIES
 * Functions for converting DOM nodes to HTML strings
 */

/**
 * Renders script content for client-side execution
 * @param props DOM attributes including client function
 * @returns Executable script content as string
 */
const renderScriptContent = (props: DOMAttributes): string => {
    try {
        if (props.client) {
            const { body, params, isAsync } = extractFunctionWithParams(props.client);
            const scriptProps = props.props || {};

            // Safely serialize parameters
            const paramsSerialized = serializeParams(params, scriptProps);

            return `(function() {
          try {
            const props = ${JSON.stringify(scriptProps)};
            ${paramsSerialized}
            ${isAsync ? 'await ' : ''}(function(${params[0] || 'element'}) {
              ${body}
            })(${params[0] ? 'document.getElementById("' + params[0] + '")' : ''});
          } catch (error) {
            console.error('Client script error:', error);
          }
        })();`;
        }
        return '';
    } catch (error) {
        console.error('Error rendering script content:', error);
        return `<!-- Error on load script -->`;
    }
};

/**
 * Renders HTML attributes from props object
 * @param props DOM attributes object
 * @returns String of HTML attributes
 */
const renderAttributes = (props: DOMAttributes): string => {
    return Object.entries(props)
        .filter(([key]) => !['children', 'client', 'loaded', 'props'].includes(key))
        .map(([key, value]) => {
            // Handle event handlers
            if (key.startsWith('on') && typeof value === 'function') {
                const { body } = extractFunctionWithParams(value);
                return `${key.toLowerCase()}="${body.replace(/"/g, '&quot;')}"`;
            }
            // Handle boolean attributes
            if (value === true) return key;
            if (value === false || value == null) return '';
            // Handle class name alias
            if (key === 'className') return `class="${value}"`;
            // Handle regular attributes
            return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
        })
        .filter(Boolean)
        .join(' ');
};

/**
 * CORE RENDERING FUNCTIONS
 * Fundamental functions for creating and rendering DOM nodes
 */

/**
 * Creates a virtual DOM node
 * @param type Element type (string or component function)
 * @param props Element attributes/properties
 * @param children Child nodes
 * @returns Virtual DOM node
 */
const createElement = (
    type: string | FunctionComponent,
    props: DOMAttributes | null,
    ...children: DOMNode[]
): DOMNode => {
    const normalizedProps = props || {};
    normalizedProps.children = children.flat().filter(isValidNode);

    // Special handling for script elements with client-side code
    if (type === 'script' && (normalizedProps.client || normalizedProps.loaded)) {
        return {
            type,
            props: normalizedProps,
            children: children.map(child =>
                typeof child === 'function' ? child : String(child)
            )
        };
    }

    // Handle function components
    if (typeof type === 'function') {
        try {
            return type(normalizedProps);
        } catch (error) {
            return `<!-- Error rendering component: ${error instanceof Error ? error.message : error} -->`;
        }
    }

    // Handle regular DOM elements
    return {
        type,
        props: normalizedProps,
        children: normalizedProps.children
    };
};

/**
 * Converts a virtual DOM node to HTML string
 * @param node Virtual DOM node to render
 * @returns HTML string representation
 */
const renderToString = async (node: DOMNode): Promise<string> => {
    // Handle promises
    //@ts-expect-error ignore promise case
    if (node instanceof Promise) return renderToString(await node);
    
    // Handle arrays of nodes
    if (Array.isArray(node)) {
        const results = await Promise.all(node.map(renderToString));
        return results.join('');
    }
    
    // Handle primitive nodes
    if (isPrimitiveNode(node)) return node != null ? String(node) : '';
    
    // Handle function components
    if (typeof node.type === 'function') return renderToString(node.type(node.props));

    const { type, props } = node;
    const children = props.children ?
        (Array.isArray(props.children) ? props.children : [props.children]) :
        [];

    // Special handling for script elements
    if (type === 'script' && (props.client || props.loaded)) {
        const attrs = renderAttributes(props);
        const content = renderScriptContent(props);
        return `<script${attrs ? ' ' + attrs : ''}>${content}</script>`;
    }

    // Handle regular elements
    const attrs = renderAttributes(props);
    const childrenHtml = await renderToString(children);
    const isVoid = isVoidElement(type);

    return isVoid ?
        `<${type}${attrs ? ' ' + attrs : ''} />` :
        `<${type}${attrs ? ' ' + attrs : ''}>${childrenHtml}</${type}>`;
};

/**
 * PUBLIC API
 */
export const DOM = {
    createElement,
    renderToString,
    extractFunctionWithParams,
    renderAttributes,
    isVoidElement,
    isPrimitiveNode,
    isValidNode
};