import { DOM, random, type DOMElement, type DOMNode, type RenderDOMOptions } from "../server";
import native from "./native";

interface RouteProps {
  path: string,
  children: DOMNode,
};

/**
 * Creates a container for routes and initializes the router
 * @param {Object} props - Component props
 * @param {DOMNode} props.children - Route components to render
 * @returns {Array} Array containing route container and initialization script
 */
export const Routes = async ({ children }: { layout?: DOMElement, children: DOMNode }) => {
  const routesid = random(16) + "-routes";
  const routes = Array.isArray(children) ? children : [children];
  return [
    DOM.createElement("div", { id: routesid }),
    DOM.createElement("script", null, [`const RoutesID = "${routesid}";window.INITIALIZE_ROUTER(RoutesID);const RoutesContext = useContext(RoutesID);`, ...routes]),
  ];
}

/**
 * Defines a route with a specific path and content
 * @param {Object} props - Route properties
 * @param {string} props.path - The path pattern for this route
 * @param {DOMNode} props.children - The content to render for this route
 * @param {boolean} [props.minify=true] - Whether to minify the output
 * @param {RenderDOMOptions} props - Additional rendering options
 * @returns {string} Script that registers the route with the router
 */
export const Router = async ({ path, children, minify = true,
  ...props
}: RouteProps & RenderDOMOptions) => {
  return `RoutesContext.routes[${JSON.stringify(path)}] = () => {${await DOM.renderToClientDOM(children, {
    minify,
    ...props
  })}; return ${props.variable ||= "$$"};};`;
}

/**
 * Creates a navigational link component
 * @param {JSX.IntrinsicElements['a']} element - Anchor element properties
 * @returns {Array} Button element that handles navigation
 */
export const Link = (element: JSX.IntrinsicElements['a']) => {
  const href = element.href
    ? element.href.startsWith("/")
      ? `${element.href}`
      : `/${element.href}`
    : "#undefined";

  return [
    DOM.createElement(
      "button",
      {
        ...element,
        onclick: `(event) => {navigate("${href}"); event.preventDefault();}`
      },
      element.children
    )];
};

/**
 * Includes the client-side library scripts
 * @returns {DOMElement} Script tag containing client library code
 */
export const ClientLibs = () => DOM.createElement("script", null, `(${native.toString().replaceAll("\n", "")})()`);

/**
 * Creates a reactive component that automatically updates
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for the component
 * @param {function} props.callback - Render function for the component
 * @returns {DOMElement} Script that initializes the reactive component
 */
export const Reactive = ({
  id,
  callback
}: {
  id: string;
  callback: (element: HTMLElement) => unknown;
}) => {
  const fnString = callback.toString().trim();
  return DOM.createElement("script", null, `window.reactiveComponent("${id}", ${fnString});`)
}

/**
 * Injects a context value into the client-side application
 * @param {Object} props - Injection properties
 * @param {string} props.id - Context identifier
 * @param {*} props.context - Context value to inject
 * @returns {Promise<DOMElement>} Script that creates the context
 */
export const InjectContext = async ({
  id,
  context
}: {
  id: string;
  context: unknown;
}) => {
  return DOM.createElement("script", null, `createContext("${id}", ${JSON.stringify(await context)})`)
}