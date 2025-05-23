import type { DOMElement, DOMNode, FunctionComponent, PrimitiveNode } from "./types";

/**
 * Extracts the body, parameters, and async status from a function
 * @param {Function} fn - The function to analyze
 * @returns {Object} An object containing:
 *                   - body: The function body as a string
 *                   - params: Array of parameter names
 *                   - isAsync: Boolean indicating if the function is async
 * @throws {Error} If the function pattern cannot be recognized
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
 * @param {unknown} node - The node to check
 * @returns {boolean} True if the node is a primitive type
 */
export const isPrimitiveNode = (node: unknown): node is PrimitiveNode => (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    node === null ||
    node === undefined
);

/**
 * Checks if a node is a JSX element (DOMElement)
 * @param {unknown} node - The node to check
 * @returns {boolean} True if the node is a DOMElement
 */
export const isElementNode = (node: unknown): node is DOMElement => (
    typeof node !== "undefined" && typeof node === 'object' && node !== null &&
    ('type' in node || 'props' in node)
);

/**
 * Enhanced DOM node validation with type-specific checks
 * @param node - The node to validate
 * @param options - Validation options
 * @returns True if the node is valid according to the specified criteria
 */
export const isValidNode = (
    node: unknown,
    options: {
        allowEmptyString?: boolean;
        allowZero?: boolean;
        allowBoolean?: boolean;
        allowPromise?: boolean;
        allowFunction?: boolean;
    } = {}
): node is DOMNode => {
    // Default options
    const {
        allowEmptyString = false,
        allowZero = true,
        allowBoolean = false,
        allowPromise = true,
        allowFunction = true,
    } = options;

    // Null/undefined check
    if (node == null) return false;

    // Boolean check
    if (typeof node === 'boolean') return allowBoolean;

    // Number check (special handling for 0)
    if (typeof node === 'number') {
        if (node === 0) return allowZero;
        return !Number.isNaN(node);
    }

    // String check (empty string handling)
    if (typeof node === 'string') return allowEmptyString || node.length > 0;

    // Promise check
    if (node instanceof Promise) return allowPromise;

    // Function check (for components)
    if (typeof node === 'function') return allowFunction;

    // Array check (recursive validation)
    if (Array.isArray(node)) {
        return node.every(child => isValidNode(child, options));
    }

    // DOM Node object check
    if (typeof node === 'object') {
        return (
            node !== null && 'type' in node && 
            node.type !== undefined && 'props' in node &&
            node.props !== undefined
        );
    }

    // All other cases
    return true;
};

// Type guard version for specific node types
export const isValidNodeOfType = <T extends DOMNode>(
    node: unknown,
    typeGuard: (n: DOMNode) => n is T,
    options?: Parameters<typeof isValidNode>[1]
): node is T => {
    return isValidNode(node, options) && typeGuard(node as DOMNode);
};

export const isComponentNode = (node: unknown): node is { type: FunctionComponent; props: any } =>
    isValidNode(node) && typeof (node as any).type === 'function';

export const isTextNode = (node: unknown): node is string | number =>
    typeof node === 'string' || typeof node === 'number';


// Set of HTML void elements that don't need closing tags
const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr',
    'img', 'input', 'link', 'meta', 'param',
    'source', 'track', 'wbr'
]);

/**
 * Checks if an HTML element type is a void element (self-closing)
 * @param {string} type - The HTML element type to check
 * @returns {boolean} True if the element is a void element
 */
export const isVoidElement = (type: string): boolean => {
    return voidElements.has(type);
};

/**
 * Generates a random string of specified length
 * @param {number} [length=64] - The length of the random string
 * @param {boolean} [ext=false] - Whether to include extended special characters
 * @returns {string} The generated random string
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
 * @param {string[]} params - Array of parameter names
 * @param {object} props - Props object containing parameter values
 * @returns {string} Serialized parameter declarations as a string
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