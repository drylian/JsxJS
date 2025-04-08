import { AttributeRender } from './attribute';
import { type DOMNode, type FunctionComponent, type DOMAttributes } from './types';
import { extractFunctionWithParams, isPrimitiveNode, isValidNode, isVoidElement } from './utils';

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
 * Renders a virtual DOM node into HTML fragments (array of strings)
 * @param node Virtual DOM node to render
 * @param fragments Optional array to accumulate fragments
 * @returns Promise with array of HTML fragments
 */
const renderToFragments = async (node: DOMNode, fragments: string[] = []): Promise<string[]> => {
    // Handle promises
    //@ts-expect-error ignore promise case
    if (node instanceof Promise) return renderToFragments(await node, fragments);

    // Handle arrays of nodes
    if (Array.isArray(node)) {
        await Promise.all(node.map(n => renderToFragments(n, fragments)));
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
        return renderToFragments(result, fragments);
    }

    const { type, props } = node;
    const children = props.children ?
        (Array.isArray(props.children) ? props.children : [props.children]) :
        [];

    // Handle regular elements
    const { scripts, attributes, lockchildren } = await AttributeRender.render(props, fragments);
    const isVoid = isVoidElement(type);
    
    // Process children only once
    const childrens: string[] = [];
    if (!lockchildren) {
        await renderToFragments(children, childrens);
    }

    // Build element HTML
    if (!lockchildren) {
        fragments.push(isVoid ?
            `<${type}${attributes ? ' ' + attributes : ''} />` :
            `<${type}${attributes ? ' ' + attributes : ''}>${childrens.join('')}</${type}>`);
    }

    // Add scripts after the element
    if (scripts.length) {
        const fragmenteds = await Promise.all(scripts.map(script => 
            renderToString(script)
        ));
        fragments.push(...fragmenteds);
    }

    return fragments;
};

/**
 * Converts a virtual DOM node to HTML string
 * @param node Virtual DOM node to render
 * @returns HTML string representation
 */
const renderToString = async (node: DOMNode): Promise<string> => {
    const fragments = await renderToFragments(node);
    return fragments.join('');
};
/**
 * PUBLIC API
 */
export const DOM = {
    createElement,
    renderToString,
    extractFunctionWithParams,
    isVoidElement,
    isPrimitiveNode,
    isValidNode
};