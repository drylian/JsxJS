import type { DOMElement, DOMNode, PrimitiveNode } from "./types";

/**
 * Extracts the body, parameters, and async status from a function
 * @param fn The function to analyze
 * @returns Object containing function body, parameters, and async status
 */
export function extractFunctionWithParams(fn: Function): {
    body: string;
    params: string[];
    isAsync: boolean;
} {
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
 * Checks if a node is a primitive type (string, number, boolean, null, or undefined)
 */
export const isPrimitiveNode = (node: unknown): node is PrimitiveNode => (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    node === null ||
    node === undefined
);

/**
 * Checks if a node is a JSX element (DOMNode)
 */
export const isElementNode = (node: unknown): node is DOMElement => (
    typeof node !== "undefined" && typeof node === 'object' && node !== null &&
    ('type' in node || 'props' in node)
);

/**
 * Checks if a node is valid (not null, undefined, or false)
 */
export const isValidNode = (node: unknown): boolean => (
    node !== null && node !== undefined && node !== false
);

const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr',
    'img', 'input', 'link', 'meta', 'param',
    'source', 'track', 'wbr'
]);

/**
 * Checks if an HTML element type is a void element (self-closing)
 */
export const isVoidElement = (type: string): boolean => {

    return voidElements.has(type);
};

/**
 * Random gerator
 */
export const random = (length: number = 64, ext: boolean = false): string => {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    if (ext) {
        chars += "!@#$%^&*()_+-={}[]|:;<>,.?/~`";
    }

    let result = "";
    const charsLength = chars.length;

    const buffer = new Array(4);

    for (let i = 0; i < length; i++) {
        for (let j = 0; j < 4; j++) {
            buffer[j] = Math.random();
        }

        const combinedRandom = buffer.reduce((acc, val, idx) => {
            return acc + (val / (idx + 1));
        }, 0) % 1;

        const randomIndex = Math.floor(combinedRandom * charsLength);
        result += chars[randomIndex];
    }

    return result;
}

/**
 * Serializes function parameters safely, handling complex objects
 * @param params Array of parameter names
 * @param props Props object containing parameter values
 * @returns Serialized parameter declarations as a string
 */
export function serializeParams(params: string[], props: object): string {
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