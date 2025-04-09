/**
 * Global flag indicating whether the hooks system has been initialized
 * @type {boolean}
 */
export const __GLOBAL_HOOKS_SETUP: boolean = "Client side only" as any;

/**
 * ID of the currently rendering component (null when no component is rendering)
 * @type {string | null}
 */
export let currentComponentId: string | null = "Client side only" as any;

/**
 * Map of reactive components with their IDs as keys
 * @type {Map<string, any>}
 */
export const __reactiveComponents: Map<string, any> = "Client side only" as any;

type StateData = {
  value: unknown;
  listeners: Set<() => void>;
};

type EffectData = {
  cleanup: (() => void) | null;
  oldDeps: unknown[] | undefined;
};

type RefData = {
  current: unknown;
};


/**
 * Core structure storing all hook states and metadata
 * @property {Map<string, {value: any, listeners: Set<() => void>}>} states - Component states storage
 * @property {Map<string, {current: any}>} refs - Component refs storage
 * @property {Map<string, {cleanup: (() => void) | null, oldDeps: any[] | undefined}>} effects - Effect callbacks and dependencies
 * @property {Map<string, number>} hookIndices - Current hook index for each component
 * @property {Map<string, Set<() => void>>} componentListeners - Component update listeners
 */
export const __GLOBAL_STATES: {
  states: Map<string, StateData>;
  refs: Map<string, RefData>;
  effects: Map<string, EffectData>;
  contexts: Map<string, unknown>;
  hookIndices: Map<string, number>;
  componentListeners: Map<string, Set<() => void>>;
  routeCache: Map<string, { html: (() => HTMLDivElement); params: Record<string, string> }>;
} = "Client side only" as any;

// ================== CORE HOOKS ================== //

/**
 * Creates a new global context
 * @template T - Type of the context value
 * @callback createContext
 * @param {string} id - Unique identifier for the context
 * @param {T} initialValue - Initial context value
 * @returns {T} The created context object
 */
export function createContext<T>(_id: string, _initialValue: T): T { return "Client side only" as any; };

/**
 * Retrieves a global context by ID
 * @template T - Expected type of the context value
 * @callback useContext
 * @param {string} id - Identifier of the context to retrieve
 * @returns {T | undefined} The context value or undefined if not found
 */
export function useContext<T>(_id: string): T | undefined { return "Client side only" as any; };

/**
 * Deletes a global context by ID
 * @callback deleteContext
 * @param {string} id - Identifier of the context to delete
 * @returns {boolean} True if context was deleted, false if not found
 */
export function deleteContext(_id: string): boolean { return "Client side only" as any; };

/**
 * React-like state hook type
 * @template T - Type of the state value
 * @callback useState
 * @param {T} initialValue - Initial state value
 * @returns {[T, (value: T | ((prev: T) => T)) => void]} State tuple [value, setter]
 */
export function useState<T>(_initialValue: T): [T, (value: T | ((prev: T) => T)) => void] { return "Client side only" as any; };

/**
 * React-like effect hook type
 * @callback useEffect
 * @param {() => (void | (() => void))} effect - Effect callback function
 * @param {any[]} [deps] - Optional dependency array
 */
export function useEffect(_effect: () => void | (() => void), _deps?: any[]) { return "Client side only" as any; };

/**
 * React-like ref hook type
 * @template T - Type of the ref value
 * @callback useRef
 * @param {T} initialValue - Initial ref value
 * @returns {{current: T}} Ref object with mutable current property
 */
export function useRef<T>(_initialValue: T): { current: T } { return "Client side only" as any; };

// ================== ROUTER TYPES ================== //

/**
 * Router context type
 * @property {string} currentPath - Current route path
 * @property {Record<string, string>} params - Route parameters
 */
export interface RouterContext {
  currentPath: string;
  routes: Record<string, (() => HTMLDivElement)>;
  element_id: string;
  params: Record<string, string>;
  previousRoute: string | null;
  cached:boolean;
}

/**
 * Navigation function type
 * @callback NavigateFunction
 * @param {string} path - Path to navigate to
 */
export type NavigateFunction = (path: string) => void;

/**
 * Creates the router system
 * @callback INITIALIZE_ROUTER
 */
export function INITIALIZE_ROUTER(_id: string): void { return "Client side only" as any; };

/**
 * Programmatically navigates to a new route
 * @callback navigate
 * @param {string} path - Path to navigate to
 */
export function navigate(_path: string): void { return "Client side only" as any; };

// ================== COMPONENT SYSTEM ================== //

/**
 * Creates a reactive component
 * @callback reactiveComponent
 * @param {string} id - Component ID (used as DOM element ID)
 */
export function reactiveComponent(_id: string, _callback: (element: HTMLElement) => unknown): () => void { return "Client side only" as any; };

/**
 * Cleans up all hooks for a specific component
 * @callback __cleanupComponent
 * @param {string} componentId - ID of the component to clean up
 */
export function __cleanupComponent(_componentId: string): void { return "Client side only" as any; };

/**
 * Cleans up all hooks for a specific route
 * @callback __cleanupRouteComponents
 * @param {string} componentId - ID of the component to clean up
 */
export function __cleanupRouteComponents(_routeid: string): void { return "Client side only" as any; };

/**
 * Cleans up all components and their associated hooks
 * @callback __cleanupAllComponents
 */
export function __cleanupAllComponents(): void { return "Client side only" as any; };

/**
 * Retrieves the current state of a component's hooks
 * @callback __getComponentState
 * @param {string} componentId - ID of the component to inspect
 * @returns {Object} Component's hook states
 * @returns {Array} [0] states - Array of state entries [key, {value, listeners}]
 * @returns {Array} [1] effects - Array of effect entries [key, {cleanup, oldDeps}]
 * @returns {Array} [2] refs - Array of ref entries [key, {current}]
 */
export function __getComponentState(_componentId: string): {
  states: [string, { value: any; listeners: Set<() => void> }][];
  effects: [string, { cleanup: (() => void) | null; oldDeps: any[] | undefined }][];
  refs: [string, { current: any }][];
} { return "Client side only" as any; };

/**
 * Global type declarations extending the Window interface
 * @namespace global
 */
declare global {
  interface Window {
    /** @type {__GLOBAL_HOOKS_SETUP} */
    __GLOBAL_HOOKS_SETUP?: typeof __GLOBAL_HOOKS_SETUP;
    _H:any[];
    /** @type {currentComponentId} */
    currentComponentId: typeof currentComponentId;
    /** @type {__reactiveComponents} */
    __reactiveComponents: typeof __reactiveComponents;

    /** @type {__GLOBAL_STATES} */
    __GLOBAL_STATES: typeof __GLOBAL_STATES;

    // Core Hooks
    /** @type {useState} */
    useState: typeof useState;
    /** @type {useEffect} */
    useEffect: typeof useEffect;
    /** @type {useRef} */
    useRef: typeof useRef;
    /** @type {createContext} */
    createContext: typeof createContext;
    /** @type {useContext} */
    useContext: typeof useContext;
    /** @type {deleteContext} */
    deleteContext: typeof deleteContext;
    /** @type {__cleanupRouteComponents} */
    __cleanupRouteComponents: typeof __cleanupRouteComponents;
    // Router System
    /** @type {INITIALIZE_ROUTER} */
    INITIALIZE_ROUTER: typeof INITIALIZE_ROUTER;
    /** @type {navigate} */
    navigate: typeof navigate;

    // Component System
    /** @type {reactiveComponent} */
    reactiveComponent: typeof reactiveComponent;

    /** @type {__cleanupComponent} */
    __cleanupComponent: typeof __cleanupComponent;
    /** @type {__cleanupAllComponents} */
    __cleanupAllComponents: typeof __cleanupAllComponents;
    /** @type {__getComponentState} */
    __getComponentState: typeof __getComponentState;
  }
}

export { };