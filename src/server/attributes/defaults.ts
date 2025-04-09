import { AttributeRender } from "../attribute";
import { DOM } from "../render";
import { extractFunctionWithParams, serializeParams } from "../utils";

/**
 * Handles className attribute for both static and client-side rendering
 * Converts className to class attribute in HTML and manages className property in DOM
 */
new AttributeRender({
    key: 'className',
    /**
     * Static rendering handler for className
     * @param {Object} param - Attribute parameters
     * @param {string} param.value - The class name value
     * @returns {Object} HTML attribute string
     */
    static: ({ value }) => {
        return {
            html: `class="${value}"`,
        };
    },
    /**
     * DOM rendering handler for className
     * @param {Object} param - Attribute parameters
     * @param {string} param.value - The class name value
     * @param {string} param.currentElement - The target element variable name
     * @returns {Object} Script to set className property
     */
    dom({ value, currentElement }) {
        return {
            scripts: [
                `${currentElement}.className = ${JSON.stringify(value)};`
            ]
        };
    },
});

/**
 * Handles client-side script execution for both static and client-side rendering
 * Processes functions to be executed on the client side with proper parameter handling
 */
new AttributeRender({
    key: 'client',
    /**
     * Static rendering handler for client scripts
     * @param {Object} param - Attribute parameters
     * @param {Function} param.value - The client function to execute
     * @param {DOMAttributes} attributes - All element attributes
     * @returns {Object} Contains scripts and rendering instructions
     */
    static: ({ value }, attributes) => {
        if (value instanceof Function) {
            const { body, params, isAsync } = extractFunctionWithParams((value as Function));
            delete attributes.client;
            const scriptProps = attributes;

            const paramsSerialized = serializeParams(params, attributes);

            return {
                lockchildren: true,
                scripts: [
                    DOM.createElement("script", null, `try {
                        const props = ${JSON.stringify(scriptProps)};
                        ${paramsSerialized}
                        ${isAsync ? 'await ' : ''}(function(${params[0] || 'element'}) {
                            ${body}
                        })(${params[0] ? 'document.getElementById("' + params[0] + '")' : ''});
                    } catch (error) {
                        console.error('Client script error:', error);
                    }`)
                ]
            };
        }
        return {};
    },
    /**
     * DOM rendering handler for client scripts
     * @param {Object} param - Attribute parameters
     * @param {Function} param.value - The client function to execute
     * @param {string} param.currentElement - The target element variable name
     * @param {DOMAttributes} attributes - All element attributes
     * @returns {Object} Contains scripts and rendering instructions
     */
    dom({ value, currentElement }, attributes) {
        if (value instanceof Function) {
            const { body, params, isAsync } = extractFunctionWithParams(value);
            delete attributes.client;
            const paramsSerialized = serializeParams(params, attributes);

            return {
                lockchildren: true,
                scripts: [
                    `try {
                        ${paramsSerialized}
                        ${isAsync ? 'await ' : ''}(${value.toString()})(${params[0] || currentElement});
                    } catch (error) {
                        console.error('Client script error:', error);
                    }`
                ]
            };
        }
        return {};
    },
});

/**
 * Handles reactive components for both static and client-side rendering
 * Manages the creation and binding of reactive components
 */
new AttributeRender({
    key: 'reactive',
    /**
     * Static rendering handler for reactive components
     * @param {Object} param - Attribute parameters
     * @param {Function} param.value - The reactive component function
     * @param {string} param.id - The element ID
     * @returns {Object} Contains initialization script
     */
    static: ({ value, id }) => {
        if (value instanceof Function) {
            const fnString = value.toString().trim();
            return {
                scripts: [
                    `window.reactiveComponent("${id}", ${fnString});`
                ]
            };
        }
        return {};
    },
    /**
     * DOM rendering handler for reactive components
     * @param {Object} param - Attribute parameters
     * @param {Function} param.value - The reactive component function
     * @param {string} param.currentElement - The target element variable name
     * @returns {Object} Contains initialization script
     */
    dom({ value, currentElement }) {
        if (value instanceof Function) {
            return {
                scripts: [
                    `window.reactiveComponent(${currentElement}, ${value.toString()});`
                ]
            };
        }
        return {};
    },
});

/** 
 * Handles event listeners for both static and client-side rendering
 * Processes all on* attributes (onclick, onchange, etc.)
 */
new AttributeRender({
    key: 'on*',
    /**
     * Static rendering handler for event listeners
     * @param {Object} param - Attribute parameters
     * @param {string} param.key - The full attribute name (e.g., "onclick")
     * @param {Function|string} param.value - The event handler
     * @param {string} param.id - The element ID
     * @returns {Object} Contains event binding script
     */
    static: ({ key, value, id }) => {
        const name = key.toLowerCase().slice(2);
        if (value instanceof Function) {
            const fnString = value.toString().trim();
            return {
                html: "",
                scripts: [
                    DOM.createElement("script", null, `document.getElementById('${id}').addEventListener('${name}', ${fnString});`)
                ]
            };
        } else if (typeof value == "string") {
            return {
                html: "",
                scripts: [
                    DOM.createElement("script", null, `document.getElementById('${id}').addEventListener('${name}', ${value});`)
                ]
            };
        }
        return {};
    },
    /**
     * DOM rendering handler for event listeners
     * @param {Object} param - Attribute parameters
     * @param {string} param.key - The full attribute name (e.g., "onclick")
     * @param {Function|string} param.value - The event handler
     * @param {string} param.currentElement - The target element variable name
     * @returns {Object} Contains event binding script
     */
    dom({ key, value, currentElement }) {
        const name = key.toLowerCase().slice(2);
        if (value instanceof Function) {
            return {
                scripts: [
                    `${currentElement}.addEventListener('${name}', ${value.toString()});`
                ]
            };
        } else if (typeof value === "string") {
            return {
                scripts: [
                    `${currentElement}.addEventListener('${name}', ${value});`
                ]
            };
        }
        return {};
    },
});