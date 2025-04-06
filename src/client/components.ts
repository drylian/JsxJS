import { DOM } from "../server";
import native from "./native";

export const ClientLibs = () => DOM.createElement("script", null, `(${native.toString()})()`);

export const Reactive = ({
  id,
  callback
}: {
  id: string;
  callback: (element: HTMLElement) => void | (() => void);
}) => {
  const fnString = callback.toString().trim();
  return DOM.createElement("script", null, `window.reactiveComponent("${id}", ${fnString});`)
}