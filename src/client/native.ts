import type { RouterContext } from "./types";

/**
 * Native client-side code that sets up global hooks and reactive component system
 */
export default () => {
  if (typeof window.__GLOBAL_HOOKS_SETUP !== "undefined") return;
  window._H = [document, window, location, self, top, "addEventListener", "alert", "appendChild", "assign", "blur", "body", "cancelAnimationFrame", "children", "classList", "className", "clearInterval", "clearTimeout", "cloneNode", "closed", "confirm", "createAttribute", "createComment", "createDocumentFragment", "createElement", "createEvent", "createRange", "createTextNode", "documentElement", "execCommand", "firstChild", "focus", "frames", "getAttribute", "getElementById", "getElementsByClassName", "getElementsByTagName", "getSelection", "hasAttribute", "hash", "head", "host", "hostname", "href", "id", "innerHTML", "insertBefore", "lastChild", "nextSibling", "opener", "origin", "outerHTML", "parent", "parentNode", "pathname", "port", "postMessage", "previousSibling", "print", "prompt", "protocol", "querySelector", "querySelectorAll", "reload", "removeAttribute", "removeChild", "removeEventListener", "replace", "replaceChild", "requestAnimationFrame", "search", "setAttribute", "setInterval", "setTimeout", "style", "textContent"];
  window.__GLOBAL_HOOKS_SETUP = true;

  // Initialize global storage with proper typing
  window.__GLOBAL_STATES = {
    states: new Map(),
    refs: new Map(),
    effects: new Map(),
    contexts: new Map(),
    hookIndices: new Map(),
    componentListeners: new Map(),
    routeCache: new Map(),
  };

  /**
   * Cleans up all hooks for components within a specific route element
   * @param {string} elementId - The ID of the route element to clean up
   */
  window.__cleanupRouteComponents = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Get all components inside the route element
    const componentsInRoute = Array.from(element.querySelectorAll('[id]'))
      .map(el => el.id)
      .filter(id => window.__GLOBAL_STATES.componentListeners.has(id));

    // Clean up each component
    componentsInRoute.forEach(componentId => {
      window.__cleanupComponent(componentId);
    });

    // Clear route cache
    window.__GLOBAL_STATES.routeCache.delete(elementId);
  };

  /**
   * Creates a context with the specified ID and initial value
   * @template T
   * @param {string} id - The unique identifier for the context
   * @param {T} initialValue - The initial value of the context
   * @returns {Proxy} A proxy object that provides access to the context value
   */
  //@ts-expect-error ignore
  window.createContext = (id, initialValue) => {
    if (window.__GLOBAL_STATES.contexts.has(id)) {
      console.warn(`Context with id "${id}" already exists. Overwriting...`);
    }

    const contextObj = {
      _value: initialValue,
      get value(): any {
        return this._value;
      },
      set value(newValue: any) {
        this._value = newValue;
        // Notify all components using this context
        window.__GLOBAL_STATES.componentListeners.forEach(listeners => {
          listeners.forEach(cb => cb());
        });
      }
    };

    const proxy = new Proxy(contextObj, {
      get(target, prop) {
        if (prop === 'value') return target.value;
        if (typeof prop === 'string' && prop in target.value) {
          return (target.value as Record<string, unknown>)[prop];
        }
        return undefined;
      },
      set(target, prop, value) {
        if (prop === 'value') {
          target.value = value;
        } else if (typeof prop === 'string') {
          target.value = {
            ...target.value,
            [prop]: value
          };
        }
        return true;
      }
    });

    window.__GLOBAL_STATES.contexts.set(id, proxy);
    return proxy;
  };

  /**
   * Retrieves a context value by its ID
   * @template T
   * @param {string} id - The ID of the context to retrieve
   * @returns {T|undefined} The context value or undefined if not found
   */
  window.useContext = <T>(id: string): T | undefined => {
    return window.__GLOBAL_STATES.contexts.get(id) as T | undefined;
  };

  /**
   * Deletes a context by its ID
   * @param {string} id - The ID of the context to delete
   * @returns {boolean} True if the context was deleted, false otherwise
   */
  window.deleteContext = (id: string): boolean => {
    return window.__GLOBAL_STATES.contexts.delete(id);
  };

  /**
   * Creates a stateful value and a function to update it
   * @template T
   * @param {T} initialValue - The initial state value
   * @returns {[T, function]} A tuple containing the current state and a function to update it
   * @throws {Error} If called outside of a reactive component
   */
  window.useState = <T>(initialValue: T): [T, (newValue: T | ((prev: T) => T)) => void] => {
    if (!window.currentComponentId) {
      throw new Error("useState must be called within a reactive component");
    }

    const componentId = window.currentComponentId;
    const currentIndex = window.__GLOBAL_STATES.hookIndices.get(componentId) || 0;
    const key = `${componentId}-${currentIndex}`;

    window.__GLOBAL_STATES.hookIndices.set(componentId, currentIndex + 1);

    if (!window.__GLOBAL_STATES.states.has(key)) {
      window.__GLOBAL_STATES.states.set(key, {
        value: initialValue,
        listeners: new Set()
      });
    }

    const state = window.__GLOBAL_STATES.states.get(key)!;

    const setState = (newValue: T | ((prev: T) => T)) => {
      const value = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(state.value as T)
        : newValue;

      if (state.value !== value) {
        state.value = value;
        state.listeners.forEach(listener => listener());

        const componentListeners = window.__GLOBAL_STATES.componentListeners.get(componentId);
        componentListeners?.forEach(cb => cb());
      }
    };

    return [state.value as T, setState];
  };

  /**
   * Initializes the router with the specified ID
   * @param {string} router_id - The ID of the router element
   */
  window.INITIALIZE_ROUTER = (router_id: string) => {
    // Create router context if it doesn't exist
    if (!window.__GLOBAL_STATES.contexts.has(router_id)) {
      window.createContext<RouterContext>(router_id, {
        currentPath: window.location.pathname,
        element_id: router_id,
        routes: {},
        params: {},
        previousRoute: null,
        cached: false
      });
    }

    /**
     * Matches a dynamic route against registered routes
     * @param {string} path - The path to match
     * @param {Object} routes - The registered routes
     * @returns {Object|null} The matched route or null
     */
    const matchDynamicRoute = (path: string, routes: Record<string, () => HTMLDivElement>) => {
      // Check cache first if enabled
      const router = window.useContext<RouterContext>(router_id);
      if (router?.cached) {
        const cached = window.__GLOBAL_STATES.routeCache.get(router_id);
        if (cached && cached.params.path === path) {
          return cached;
        }
      }

      const pathSegments = path.split('/').filter(Boolean);
      let bestMatch = null;
      let bestScore = -1;

      for (const [routePattern, html] of Object.entries(routes)) {
        const routeSegments = routePattern.split('/').filter(Boolean);
        const params: Record<string, string> = {};
        let isMatch = true;
        let wildcardMatch = false;
        let currentScore = 0;

        const hasWildcard = routeSegments.includes('*');
        const compareLength = hasWildcard
          ? routeSegments.indexOf('*')
          : routeSegments.length;

        if (!hasWildcard && pathSegments.length !== routeSegments.length) {
          continue;
        }

        for (let i = 0; i < compareLength; i++) {
          const routeSeg = routeSegments[i];
          const pathSeg = pathSegments[i];

          if (routeSeg?.startsWith(':')) {
            const paramName = routeSeg.slice(1);
            params[paramName] = pathSeg!;
            currentScore += 1; // Dynamic segments have lower priority
          } else if (routeSeg === '*') {
            wildcardMatch = true;
            params['wildcard'] = pathSegments.slice(i).join('/');
            currentScore += 0; // Wildcards have lowest priority
            break;
          } else if (routeSeg !== pathSeg) {
            isMatch = false;
            break;
          } else {
            currentScore += 2; // Static segments have higher priority
          }
        }

        if (hasWildcard && !wildcardMatch && compareLength < pathSegments.length) {
          params['wildcard'] = pathSegments.slice(compareLength).join('/');
        }

        if (isMatch && currentScore > bestScore) {
          bestMatch = { matchedRoute: routePattern, params, html };
          bestScore = currentScore;
        }
      }

      // Cache the result if cache is enabled
      if (bestMatch && router?.cached) {
        window.__GLOBAL_STATES.routeCache.set(router_id, {
          ...bestMatch,
        });
      }

      return bestMatch;
    };

    /**
     * Renders the current route
     */
    const renderRoute = () => {
      const router = window.useContext<RouterContext>(router_id);
      if (!router) return;
    
      const { currentPath, routes, element_id, previousRoute, cached } = router;
      const element = document.getElementById(element_id);
    
      if (!element) {
        console.error(`Element with ID ${element_id} not found.`);
        return;
      }
    
      // Clean up previous route components if path changed and cache is disabled
      if (previousRoute && previousRoute !== currentPath && !cached) {
        window.__cleanupRouteComponents(element_id);
      }
    
      // Try to find matching route
      let html = routes[currentPath];
      let params: Record<string, string> = {};
    
      if (!html) {
        const dynamicMatch = matchDynamicRoute(currentPath, router.routes);
        if (dynamicMatch) {
          html = dynamicMatch.html;
          params = dynamicMatch.params;
          router.params = params;
        }
      }
    
      if (html) {
        // Create a container to parse the HTML
        const container = html();
    
        // Extract scripts before adding to DOM
        const scripts = Array.from(container.querySelectorAll("script"));
        scripts.forEach(script => script.remove());
    
        // Only update if content changed
        if (element.innerHTML !== container.innerHTML) {
          // Clear existing content
          element.innerHTML = "";
    
          // Append new content (excluding scripts)
          Array.from(container.childNodes).forEach(child => {
            element.appendChild(child);
          });
    
          // Re-inject and execute scripts
          scripts.forEach(oscript => {
            const nscript = document.createElement("script");
    
            // Copy all attributes
            Array.from(oscript.attributes).forEach(attr => {
              nscript.setAttribute(attr.name, attr.value);
            });
    
            if (oscript.src) {
              // External script
              nscript.src = oscript.src;
              document.head.appendChild(nscript);
            } else {
              // Inline script
              nscript.textContent = oscript.textContent;
              document.head.appendChild(nscript);
              document.head.removeChild(nscript); // Trigger execution
            }
          });
        }
    
        // Update previous route
        router.previousRoute = currentPath;
    
        // Dispatch route change event
        window.dispatchEvent(new CustomEvent("routechange", {
          detail: { path: currentPath, params }
        }));
      } else {
        console.warn(`Route "${currentPath}" not found.`);
      }
    };
    
    /**
     * Navigates to the specified path
     * @param {string} path - The path to navigate to
     */
    window.navigate = (path: string) => {
      const router = window.useContext<RouterContext>(router_id);
      if (router) {
        router.currentPath = path;
        history.pushState({}, "", path);
        renderRoute();
      }
    };

    // Optimized popstate handler
    const handlePopState = () => {
      const router = window.useContext<RouterContext>(router_id);
      if (router) {
        router.currentPath = window.location.pathname;
        renderRoute();
      }
    };

    // Use passive event listener for better performance
    window.addEventListener("popstate", handlePopState, { passive: true });

    // Initial render
    window.addEventListener("DOMContentLoaded", ()=> window.navigate("/"))

    // Return cleanup function
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.__cleanupRouteComponents(router_id);
    };
  };

  /**
   * Creates a mutable ref object
   * @param {*} initialValue - The initial value for the ref
   * @returns {Object} A ref object with a current property
   * @throws {Error} If called outside of a reactive component
   */
  window.useRef = (initialValue) => {
    if (!window.currentComponentId!) {
      throw new Error("useRef must be called within a reactive component");
    }

    // Initialize hook index tracking if not exists
    if (!window.__GLOBAL_STATES.hookIndices.has(window.currentComponentId!)) {
      window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId!, 0);
    }

    // Get current hook index and increment for next hook
    const currentIndex = window.__GLOBAL_STATES.hookIndices.get(window.currentComponentId!)!;
    const key = `${window.currentComponentId!}-${currentIndex}`;
    window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId!, currentIndex + 1);

    // Return existing ref or create new one
    if (!window.__GLOBAL_STATES.refs.has(key)) {
      window.__GLOBAL_STATES.refs.set(key, {
        current: initialValue
      });
    }

    return window.__GLOBAL_STATES.refs.get(key) as { current: typeof initialValue };
  };

  /**
   * Performs side effects in reactive components
   * @param {function} effect - The effect function to run
   * @param {Array} deps - Dependency array that determines when the effect runs
   * @throws {Error} If called outside of a reactive component
   */
  window.useEffect = (effect, deps) => {
    if (!window.currentComponentId!) {
      throw new Error("useEffect must be called within a reactive component");
    }

    // Initialize hook index tracking if not exists
    if (!window.__GLOBAL_STATES.hookIndices.has(window.currentComponentId!)) {
      window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId!, 0);
    }

    // Get current hook index and increment for next hook
    const currentIndex = window.__GLOBAL_STATES.hookIndices.get(window.currentComponentId!)!;
    const key = `${window.currentComponentId!}-${currentIndex}`;
    window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId!, currentIndex + 1);

    // Get existing effect data or initialize new
    let effectData = window.__GLOBAL_STATES.effects.get(key);
    const isFirstRun = !effectData;

    if (isFirstRun) {
      effectData = {
        cleanup: null,    // Stores cleanup function
        oldDeps: deps     // Stores previous dependencies for comparison
      };
      window.__GLOBAL_STATES.effects.set(key, effectData);
    }

    // Check if dependencies have changed
    const hasChanged = isFirstRun ||
      !deps ||
      !effectData?.oldDeps ||
      deps.some((dep, i) => dep !== effectData?.oldDeps?.[i]);

    // Run effect if dependencies changed
    if (hasChanged && effectData) {
      // Clean up previous effect if exists
      if (effectData?.cleanup) effectData?.cleanup();
      // Run new effect and store cleanup function
      effectData.cleanup = effect() as () => void;
      effectData.oldDeps = deps;
    }
  };

  // Registry for all reactive components
  window.__reactiveComponents = new Map();

  /**
   * Cleans up all hooks for a specific component
   * @param {string} componentId - The ID of the component to clean up
   */
  window.__cleanupComponent = (componentId) => {
    // Clean up all effects
    for (const [key, value] of window.__GLOBAL_STATES.effects) {
      if (key.startsWith(componentId + '-') && value.cleanup) {
        value.cleanup();
        window.__GLOBAL_STATES.effects.delete(key);
      }
    }

    // Clean up all states
    for (const [key] of window.__GLOBAL_STATES.states) {
      if (key.startsWith(componentId + '-')) {
        window.__GLOBAL_STATES.states.delete(key);
      }
    }

    // Clean up all refs
    for (const [key] of window.__GLOBAL_STATES.refs) {
      if (key.startsWith(componentId + '-')) {
        window.__GLOBAL_STATES.refs.delete(key);
      }
    }

    // Remove all component listeners and indices
    window.__GLOBAL_STATES.componentListeners.delete(componentId);
    window.__GLOBAL_STATES.hookIndices.delete(componentId);
  };

  /**
   * Cleans up all registered components
   */
  window.__cleanupAllComponents = () => {
    for (const componentId of window.__GLOBAL_STATES.componentListeners.keys()) {
      window.__cleanupComponent(componentId);
    }
  };

  /**
   * Debug utility to inspect component state
   * @param {string} componentId - The ID of the component to inspect
   * @returns {Object} An object containing the component's states, effects, and refs
   */
  window.__getComponentState = (componentId) => {
    return {
      states: Array.from(window.__GLOBAL_STATES.states.entries())
        .filter(([key]) => key.startsWith(componentId + '-')),
      effects: Array.from(window.__GLOBAL_STATES.effects.entries())
        .filter(([key]) => key.startsWith(componentId + '-')),
      refs: Array.from(window.__GLOBAL_STATES.refs.entries())
        .filter(([key]) => key.startsWith(componentId + '-'))
    };
  };

  /**
   * Creates a reactive component that automatically updates when state changes
   * @param {string} reference - Component ID (used as DOM element ID)
   * @param {function} callback - Component render function
   * @returns {function} A cleanup function to unmount the component
   */
  //@ts-expect-error ignore
  window.reactiveComponent = (reference, callback) => {
    const element = document.getElementById(reference);
    if (!element) return;

    let isMounted = true;
    let pendingUpdate = false;
    let cleanupFunctions: (() => void)[] = [];

    // Clean up previous instance
    window.__cleanupComponent(reference);

    // Set current component context
    window.currentComponentId = reference;
    window.__GLOBAL_STATES.hookIndices.set(reference, 0);

    const updateComponent = async () => {
      if (!isMounted || pendingUpdate) return;
      pendingUpdate = true;

      // Run cleanup functions from previous render
      cleanupFunctions.forEach(fn => fn());
      cleanupFunctions = [];

      // Reset hook index
      window.__GLOBAL_STATES.hookIndices.set(reference, 0);
      window.currentComponentId = reference;

      try {
        const result = callback(element);
        if (result && result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(`Error in reactive component #${reference}:`, error);
      } finally {
        pendingUpdate = false;
      }
    };

    // Register component update listener
    if (!window.__GLOBAL_STATES.componentListeners.has(reference)) {
      window.__GLOBAL_STATES.componentListeners.set(reference, new Set());
    }
    const listeners = window.__GLOBAL_STATES.componentListeners.get(reference)!;
    listeners.add(updateComponent);

    // Initial render
    updateComponent();

    // Return cleanup function
    return () => {
      isMounted = false;
      cleanupFunctions.forEach(fn => fn());
      window.currentComponentId = null;
      listeners.delete(updateComponent);

      if (listeners.size === 0) {
        window.__cleanupComponent(reference);
      }
    };
  }
}