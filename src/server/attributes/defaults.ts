import { AttributeRender } from "../attribute";
import { DOM } from "../render";
import { extractFunctionWithParams, serializeParams } from "../utils";

/**
 * React className
 */
new AttributeRender({
    key: 'className',
    action: ({ value }) => {
        return {
            html: `class="${value}"`,
        };
    }
})

new AttributeRender({
    key: 'client',
    action: ({ value }, attributes) => {
        if (value instanceof Function) {
            const { body, params, isAsync } = extractFunctionWithParams((value as Function));
            delete attributes.client;
            const scriptProps = attributes

            // Safely serialize parameters
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
    }
})

new AttributeRender({
    key: 'reactive',
    action: ({ value, id }) => {
        if (value instanceof Function) {
            const fnString = value.toString().trim();
            return {
                scripts: [
                    `window.reactiveComponent("${id}", ${fnString});`
                ]
            };
        }
        return {};
    }
})

/** 
 * Events callback
 */
new AttributeRender({
    key: 'on*',
    action: ({ key, value, id }) => {
        const name = key.toLowerCase().slice(2);
        if (value instanceof Function) {
            const fnString = value.toString().trim();
            return {
                html: "",
                scripts: [
                    DOM.createElement("script", null, `document.getElementById('${id}').addEventListener('${name}', ${fnString});`)
                ]
            };
        } else if(typeof value == "string") {
            return {
                html: "",
                scripts: [
                    DOM.createElement("script", null, `document.getElementById('${id}').addEventListener('${name}', ${value});`)
                ]
            };
        }
        return {};
    }
})