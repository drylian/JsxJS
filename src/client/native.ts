/**
 * Native code of client side
 * Sets up global hooks and reactive component system
 */
export default () => {
  // Check if hooks setup has already been done to avoid reinitialization
  if (typeof window.__GLOBAL_HOOKS_SETUP == "undefined") {
    window.__GLOBAL_HOOKS_SETUP = true;

    // Global storage for all component states, refs, effects and their metadata
    window.__GLOBAL_STATES = {
      states: new Map(),       // Stores all useState values
      refs: new Map(),        // Stores all useRef values
      effects: new Map(),     // Stores all useEffect data
      hookIndices: new Map(), // Tracks current hook index per component
      componentListeners: new Map() // Stores update callbacks for components
    };

    /**
     * useState implementation
     * Manages component state with initial value
     */
    window.useState = (initialValue) => {
      if (!window.currentComponentId) {
        throw new Error("useState must be called within a reactive component");
      }

      const componentId = window.currentComponentId;

      // Initialize hook index tracking for this component if not exists
      if (!window.__GLOBAL_STATES.hookIndices.has(componentId)) {
        window.__GLOBAL_STATES.hookIndices.set(componentId, 0);
      }

      // Get current hook index and increment for next hook
      const currentIndex = window.__GLOBAL_STATES.hookIndices.get(componentId)!;
      const key = `${componentId}-${currentIndex}`;
      window.__GLOBAL_STATES.hookIndices.set(componentId, currentIndex + 1);

      // Initialize state if it doesn't exist
      if (!window.__GLOBAL_STATES.states.has(key)) {
        window.__GLOBAL_STATES.states.set(key, {
          value: initialValue,
          listeners: new Set() // Stores subscribers to state changes
        });
      }

      const state = window.__GLOBAL_STATES.states.get(key)!;

      /**
       * setState function
       * Updates state value and notifies all subscribers
       */
      const setState = (newValue: unknown) => {
        // Handle functional updates
        const value = typeof newValue === 'function'
          ? newValue(state.value)
          : newValue;

        // Only update if value actually changed
        if (state.value !== value) {
          state.value = value;
          // Notify all state listeners
          state.listeners.forEach(listener => listener());
          // Notify component to re-render
          if (window.__GLOBAL_STATES.componentListeners.has(componentId)) {
            window.__GLOBAL_STATES.componentListeners.get(componentId)!.forEach(cb => cb());
          }
        }
      }

      return [state.value, setState];
    };

    /**
     * useRef implementation
     * Creates a persistent mutable reference
     */
    window.useRef = (initialValue) => {
      if (!window.currentComponentId) {
        throw new Error("useRef must be called within a reactive component");
      }

      // Initialize hook index tracking if not exists
      if (!window.__GLOBAL_STATES.hookIndices.has(window.currentComponentId)) {
        window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId, 0);
      }

      // Get current hook index and increment for next hook
      const currentIndex = window.__GLOBAL_STATES.hookIndices.get(window.currentComponentId)!;
      const key = `${window.currentComponentId}-${currentIndex}`;
      window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId, currentIndex + 1);

      // Return existing ref or create new one
      if (!window.__GLOBAL_STATES.refs.has(key)) {
        window.__GLOBAL_STATES.refs.set(key, {
          current: initialValue
        });
      }

      return window.__GLOBAL_STATES.refs.get(key) as { current: typeof initialValue };
    };

    /**
     * useEffect implementation
     * Handles side effects with dependency tracking
     */
    window.useEffect = (effect, deps) => {
      if (!window.currentComponentId) {
        throw new Error("useEffect must be called within a reactive component");
      }

      // Initialize hook index tracking if not exists
      if (!window.__GLOBAL_STATES.hookIndices.has(window.currentComponentId)) {
        window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId, 0);
      }

      // Get current hook index and increment for next hook
      const currentIndex = window.__GLOBAL_STATES.hookIndices.get(window.currentComponentId)!;
      const key = `${window.currentComponentId}-${currentIndex}`;
      window.__GLOBAL_STATES.hookIndices.set(window.currentComponentId, currentIndex + 1);

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

    // Cleans up all components
    window.__cleanupAllComponents = () => {
      for (const componentId of window.__GLOBAL_STATES.componentListeners.keys()) {
        window.__cleanupComponent(componentId);
      }
    };

    /**
     * Debug utility to inspect component state
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
     * @param reference Component ID (used as DOM element ID)
     * @param callback Component render function
     */
    window.reactiveComponent = (reference, callback) => {
      const element = document.getElementById(reference);
      if (!element) return;

      let cleanup: any;
      let isMounted = true;
      let pendingUpdate = false;

      // Clean up any previous instance with same ID
      if (window.__cleanupComponent) {
        window.__cleanupComponent(reference);
      }

      // Set current component context
      window.currentComponentId = reference;
      window.__GLOBAL_STATES.hookIndices.set(reference, 0);

      /**
       * Update function that re-renders the component
       */
      const updateComponent = async () => {
        if (!isMounted || pendingUpdate) return;
        pendingUpdate = true;

        // Clean up previous render if needed
        if (typeof cleanup == "function") cleanup();

        // Reset hook index before rendering
        window.__GLOBAL_STATES.hookIndices.set(reference, 0);
        window.currentComponentId = reference;

        try {
          // Execute component callback
          const result = await ((element) => callback(element))(element) as Promise<any> | any;

          // Handle potential promise return
          if (result && typeof result.then === 'function') {
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
      const listeners = window.__GLOBAL_STATES.componentListeners.get(reference);
      listeners?.add(updateComponent);

      // Initial render
      updateComponent();

      // Return cleanup function for unmounting
      return () => {
        isMounted = false;
        if (cleanup) cleanup();
        window.currentComponentId = null;

        // Remove this specific update listener
        listeners?.delete(updateComponent);

        // If no listeners left, clean up completely
        if (listeners?.size === 0) {
          window.__cleanupComponent(reference);
        }
      };
    }
  }
}