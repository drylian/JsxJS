import { AttributeRender } from './attribute';
import { type DOMNode, type FunctionComponent, type DOMAttributes, type RenderDOMOptions } from './types';
import { extractFunctionWithParams, isPrimitiveNode, isValidNode, isVoidElement } from './utils';

// Constants for DOM API optimization
const GLOBAL_OBJECTS = ['document', 'window', 'location', 'self', 'top'] as const;
const DOM_API = [
    'addEventListener', 'alert', 'appendChild', 'assign', 'blur', 'body',
    'cancelAnimationFrame', 'children', 'classList', 'className',
    'clearInterval', 'clearTimeout', 'cloneNode', 'closed', 'confirm',
    'createAttribute', 'createComment', 'createDocumentFragment',
    'createElement', 'createEvent', 'createRange', 'createTextNode',
    'documentElement', 'execCommand', 'firstChild', 'focus',
    'frames', 'getAttribute', 'getElementById', 'getElementsByClassName',
    'getElementsByTagName', 'getSelection', 'hasAttribute', 'hash', 'head',
    'host', 'hostname', 'href', 'id', 'innerHTML', 'insertBefore',
    'lastChild', 'nextSibling', 'opener', 'origin',
    'outerHTML', 'parent', 'parentNode', 'pathname', 'port', 'postMessage',
    'previousSibling', 'print', 'prompt', 'protocol', 'querySelector',
    'querySelectorAll', 'reload', 'removeAttribute', 'removeChild',
    'removeEventListener', 'replace', 'replaceChild', 'requestAnimationFrame',
    'search', 'setAttribute', 'setInterval', 'setTimeout', 'style',
    'textContent',
] as const;
const DOM_INDEX_MAP = new Map([...GLOBAL_OBJECTS, ...DOM_API].map((key, index) => [key, index]));

/**
 * Creates a virtual DOM element
 * @param {string|FunctionComponent} type - The element type (tag name or component function)
 * @param {DOMAttributes|null} props - Element attributes and properties
 * @param {...DOMNode} children - Child nodes to append
 * @returns {DOMNode} The created virtual DOM node
 * @throws Will return error comment if component rendering fails
 */
export const createElement = (
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
 * Compresses HTML/JS code by removing comments and whitespace
 * @param {string} code - The code to compress
 * @returns {string} The compressed code
 */
export const compress = (code: string): string => {
    return code
        // Protect string literals first
        .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g, match => {
            return `%%%STRING${Buffer.from(match).toString('base64')}%%%`;
        })
        // Remove single-line comments
        .replace(/\/\/.*$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove HTML comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Restore string literals
        .replace(/%%%STRING([^%]+)%%%/g, (_, encoded) => {
            return Buffer.from(encoded, 'base64').toString('utf8');
        })
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/\s?\/>/g, '/>')
        .trim();
};

/**
 * Renders a virtual DOM node into HTML fragments
 * @param {DOMNode} node - The virtual DOM node to render
 * @param {string[]} [fragments=[]] - Array to accumulate HTML fragments
 * @returns {Promise<string[]>} Promise resolving to array of HTML fragments
 */
export const renderToStringFragments = async (node: DOMNode, fragments: string[] = []): Promise<string[]> => {
    // Handle promises
    if (node instanceof Promise) {
        //@ts-expect-error loop element type
        return renderToStringFragments(await node, fragments);
    }

    // Handle arrays of nodes
    if (Array.isArray(node)) {
        await Promise.all(node.map(n => renderToStringFragments(n, fragments)));
        return fragments;
    }

    // Handle primitive nodes
    if (isPrimitiveNode(node)) {
        const result = node != null ? String(node) : '';
        fragments.push(result);
        return fragments;
    }

    // Handle function components
    if (typeof node.type === 'function') {
        const result = node.type(node.props);
        return renderToStringFragments(result, fragments);
    }

    // Process element node
    const { type, props } = node;
    const children = props.children ? 
        (Array.isArray(props.children) ? props.children : [props.children]) : 
        [];

    // Render attributes and check for locked children
    const { scripts, attributes, lockchildren } = await AttributeRender.render_static(props, fragments);
    const isVoid = isVoidElement(type);

    // Process children if not locked
    const childrenFragments: string[] = [];
    if (!lockchildren) {
        await renderToStringFragments(children, childrenFragments);
    }

    // Build element HTML if not locked
    if (!lockchildren) {
        const openingTag = `<${type}${attributes ? ' ' + attributes : ''}`;
        if (isVoid) {
            fragments.push(`${openingTag} />`);
        } else {
            fragments.push(`${openingTag}>`);
            fragments.push(...childrenFragments);
            fragments.push(`</${type}>`);
        }
    }

    // Add scripts after the element
    if (scripts.length) {
        const scriptFragments = await Promise.all(scripts.map(script =>
            renderToStringFragments(script)
        ));
        scriptFragments.forEach(sf => fragments.push(...sf));
    }

    return fragments;
};

export const renderToString = async (node: DOMNode, minify = true): Promise<string> => {
    const fragments = await renderToStringFragments(node);
    
    // Structure detection and content collection
    let doctype = false;
    let html = false;
    let head = false;
    let body = false;
    const head_contents: string[] = [];
    const body_contents: string[] = [];
    const other_contents: string[] = [];
    const html_attrs: string[] = [];

    // Parse fragments and organize content
    for (const fragment of fragments) {
        if (/<!doctype/i.test(fragment.toLowerCase())) {
            doctype = true;
            continue;
        }
        
        const htmlTagMatch = fragment.match(/<html\s([^>]*)>/i);
        if (htmlTagMatch) {
            html = true;
            if (htmlTagMatch[1]) {
                html_attrs.push(htmlTagMatch[1]);
            }
            continue;
        }
        
        if (/<head[\s>]/i.test(fragment)) {
            head = true;
            continue;
        }
        
        if (/<body[\s>]/i.test(fragment)) {
            body = true;
            continue;
        }
        
        if (/<\/?(html|head|body)[\s>]/i.test(fragment)) {
            continue;
        }
        
        if (head && !body) {
            head_contents.push(fragment);
        } else if (body) {
            body_contents.push(fragment);
        } else {
            other_contents.push(fragment);
        }
    }

    // Build final HTML structure
    const builded: string[] = [];
    
    // Document type and root element
    if (!doctype && (html || head || body)) {
        builded.push('<!DOCTYPE html>');
    }
    
    const attrs = html_attrs.length > 0 ? ` ${html_attrs.join(' ')}` : '';
    builded.push(`<html${attrs}>`);
    
    // Head section
    if (head || head_contents.length > 0) {
        builded.push('<head>', ...head_contents, '</head>');
    }
    
    // Body section
    const body_context = body || body_contents.length > 0;
    if (body_context) {
        builded.push('<body>', ...body_contents, '</body>');
    }
    
    // Handle remaining content
    if (other_contents.length > 0) {
        if (body_context) {
            body_contents.push(...other_contents);
        } else {
            builded.push('<body>', ...other_contents, '</body>');
        }
    }
    
    // Close document
    builded.push('</html>');
    
    let result = builded.join("");
    return minify ? compress(result) : result;
};

/**
 * Renders virtual DOM to client-side DOM creation code
 * @param {DOMNode} node - The virtual DOM node to render
 * @param {RenderDOMOptions} [options] - Rendering options
 * @param {string} [options.variable="$$"] - Variable name for root element
 * @param {string} [options.prefix="$"] - Prefix for generated variables
 * @param {boolean} [options.minify=true] - Whether to minify the output
 * @param {boolean} [options.fragment=false] - Whether to create document fragment
 * @returns {Promise<string>} Promise resolving to DOM creation code
 */
export const renderToClientDOM = async (
    node: DOMNode,
    {
        variable = "$$",
        prefix = "$",
        minify = true,
        fragment = false,
    }: RenderDOMOptions = {}
): Promise<string> => {
    const codeFragments: string[] = [];
    let idCounter = 0;

    const genVar = () => `${prefix}${idCounter++}`;

    /**
     * Optimizes DOM API access for minification
     * @param {string} object - The object containing the property
     * @param {string} prop - The property to access
     * @returns {string} The optimized accessor code
     */
    const minifyAccess = (object: string, prop: string): string => {
        if (!minify) return `${object}.${prop}`;

        const objectIndex = DOM_INDEX_MAP.get(object as never);
        const propIndex = DOM_INDEX_MAP.get(prop as never);

        // Handle both document.createElement and element.appendChild cases
        if (objectIndex !== undefined && propIndex !== undefined) {
            return `_H[${objectIndex}][_H[${propIndex}]]`;
        }
        if (propIndex !== undefined) {
            return `${object}[_H[${propIndex}]]`;
        }
        return `${object}.${prop}`;
    };

    /**
     * Processes element attributes
     * @param {string} elementVar - The variable name of the element
     * @param {any} props - The element properties
     */
    const processAttributes = async (elementVar: string, props: any) => {
        const { fragments } = await AttributeRender.render_dom(props, {
            currentElement: elementVar,
            fragments: []
        });
        codeFragments.push(...fragments);
    };

    /**
     * Creates a text node from primitive value
     * @param {string|number|boolean} value - The text content
     * @param {string} parentVar - The parent element variable
     */
    const createPrimitiveNode = (value: string | number | boolean, parentVar: string) => {
        const textVar = genVar();
        codeFragments.push(
            `const ${textVar}=${minifyAccess('document', 'createTextNode')}(${JSON.stringify(String(value))});`,
            `${minifyAccess(parentVar, 'appendChild')}(${textVar});`
        );
    };

    /**
     * Creates a DOM element
     * @param {string} type - The element type
     * @param {any} props - The element properties
     * @param {string} parentVar - The parent element variable
     * @returns {Promise<string>} Promise resolving to element variable name
     */
    const createElement = async (type: string, props: any, parentVar: string) => {
        const elementVar = genVar();
        codeFragments.push(
            `const ${elementVar}=${minifyAccess('document', 'createElement')}(${JSON.stringify(type)});`
        );

        await processAttributes(elementVar, props);
        codeFragments.push(`${minifyAccess(parentVar, 'appendChild')}(${elementVar});`);

        return elementVar;
    };

    /**
     * Recursively walks the virtual DOM tree
     * @param {DOMNode} node - The current node to process
     * @param {string} parentVar - The parent element variable
     */
    const walk = async (node: DOMNode, parentVar: string): Promise<void> => {
        if (node instanceof Promise) {
            //@ts-expect-error loop element type
            return walk(await node, parentVar);
        }

        if (Array.isArray(node)) {
            await Promise.all(node.map(child => walk(child, parentVar)));
            return;
        }

        if (isPrimitiveNode(node)) {
            //@ts-expect-error loop element type
            return createPrimitiveNode(node, parentVar);
        }

        if (typeof node.type === 'function') {
            const result = node.type(node.props);
            return walk(result, parentVar);
        }

        const elementVar = await createElement(node.type, node.props, parentVar);

        if (node.props?.children) {
            const children = Array.isArray(node.props.children)
                ? node.props.children
                : [node.props.children];
            await Promise.all(children.map(child => walk(child, elementVar)));
        }
    };

    // Initialize root element
    const rootCreation = fragment
        ? `const ${variable}=${minifyAccess('document', 'createDocumentFragment')}();`
        : `const ${variable}=${minifyAccess('document', 'createElement')}('div');`;
    codeFragments.push(rootCreation);

    // Build DOM tree
    await walk(node, variable);

    let finalCode = codeFragments.join('');
    if (minify) {
        // Final cleanup pass for any remaining global references
        finalCode = finalCode.replace(
            new RegExp(`\\b(${GLOBAL_OBJECTS.join('|')})\\b`, 'g'),
            (match) => {
                const index = DOM_INDEX_MAP.get(match as never);
                return index !== undefined ? `_H[${index}]` : match;
            }
        );
    }

    return minify ? compress(finalCode) : finalCode;
};

export function jsx(type: string | FunctionComponent, props: any, key?: string): DOMNode {
    const children = props?.children ?? [];
    const { children: _, ...restProps } = props || {};
    return createElement(
        type,
        key ? { ...restProps, key } : restProps,
        ...(Array.isArray(children) ? children : [children])
    );
}

export function jsxs(type: string | FunctionComponent, props: any, key?: string): DOMNode {
    return jsx(type, props, key);
}

export function Fragment(props: { children?: DOMNode }): DOMNode {
    return props?.children ?? [];
}


export const DOM = {
    createElement,
    renderToString,
    extractFunctionWithParams,
    renderToStringFragments,
    renderToClientDOM,
    isVoidElement,
    isPrimitiveNode,
    isValidNode,
    jsx,
    jsxs,
    Fragment
};


//@ts-expect-error use caeljs in swc compiler
global.CAELJS = DOM;