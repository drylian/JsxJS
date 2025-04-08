import { DOM, isElementNode, isPrimitiveNode, isValidNode, random, type DOMElement, type DOMNode } from "../server";
import native from "./native";
import { navigate } from "./types";

interface RouteProps {
  path: string,
  children: DOMNode
};

export const Routes = async ({ children, }: { layout?: DOMElement, children: DOMNode }) => {
  const routesid = random(16) + "-routes";
  const routes = Array.isArray(children) ? children : [children];
  return [
    DOM.createElement("div", { id: routesid }),
    DOM.createElement("script", null, [`const RoutesID = "${routesid}";window.INITIALIZE_ROUTER(RoutesID);const RoutesContext = useContext(RoutesID);`, ...routes]),
  ];

}

export const Router = async ({ path, children }: RouteProps) => {
  return `RoutesContext.routes[${JSON.stringify(path)}] = ${"`"}${(
    await DOM.renderToString(children))
    .replace(/"/g, '&quot;')
    .replace(/`/g, '&#96;')
    .replace(/'/g, '&apos;')
    .replace(/\//g, '&#47;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  }${"`"};`;
}

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

export const ClientLibs = () => DOM.createElement("script", null, `(${native.toString()})()`);

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

export const InjectContext = async ({
  id,
  context
}: {
  id: string;
  context: unknown;
}) => {
  return DOM.createElement("script", null, `createContext("${id}", ${JSON.stringify(await context)})`)
}