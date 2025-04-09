/* ====================== */
/* === Core DOM Types === */
/* ====================== */

import type { Reactive } from "../client";

/**
 * Represents a DOM node which can be:
 * - A primitive value (string, number, boolean, null, undefined)
 * - A DOM element object
 * - An array of DOM nodes
 * - A Promise that resolves to any of the above
 * 
 * @typedef {string|number|boolean|null|undefined|DOMElement|DOMNode[]|Promise<unknown>} DOMNode
 */
export type DOMNode =
    | PrimitiveNode
    | DOMElement
    | DOMNode[]
    | Promise<unknown>;

/**
 * Primitive node types that can be rendered as text content
 * 
 * @typedef {string|number|boolean|null|undefined} PrimitiveNode
 */
export type PrimitiveNode = string | number | boolean | null | undefined;

/**
 * Interface representing a DOM element with type, props, and children
 * 
 * @interface DOMElement
 * @property {string|FunctionComponent} type - The element type or component function
 * @property {DOMAttributes} props - Element attributes and properties
 * @property {DOMNode[]} children - Child nodes
 */
export interface DOMElement {
    type: string | FunctionComponent;
    props: DOMAttributes;
    children: DOMNode[];
}

/**
 * Function component type that accepts props and returns a DOMNode
 * 
 * @template P - Type of props (extends DOMAttributes)
 * @typedef {(props: P) => DOMNode} FunctionComponent
 */
export type FunctionComponent<P extends DOMAttributes = DOMAttributes> = (props: P) => DOMNode;

/* ======================== */
/* === Event Interfaces === */
/* ======================== */

/**
 * Base synthetic event interface
 * 
 * @interface SyntheticEvent
 * @template T - Type of the event target (defaults to Element)
 */
interface SyntheticEvent<T = Element> {
    /** The element that the event handler is attached to */
    currentTarget: T;
    /** The element that triggered the event */
    target: EventTarget & T;
    /** Prevent the default browser behavior */
    preventDefault(): void;
    /** Stop event propagation */
    stopPropagation(): void;
    /** The native browser event */
    nativeEvent: Event;
}

/**
 * Keyboard event interface
 * 
 * @interface SyntheticKeyboardEvent
 * @extends SyntheticEvent
 */
interface SyntheticKeyboardEvent<T = Element> extends SyntheticEvent<T> {
    /** The key value of the key pressed */
    key: string;
    /** The physical key code */
    code: string;
    /** Whether the Ctrl key was pressed */
    ctrlKey: boolean;
    /** Whether the Shift key was pressed */
    shiftKey: boolean;
    /** Whether the Alt key was pressed */
    altKey: boolean;
    /** Whether the Meta key was pressed */
    metaKey: boolean;
}

/**
 * Mouse event interface
 * 
 * @interface SyntheticMouseEvent
 * @extends SyntheticEvent
 */
interface SyntheticMouseEvent<T = Element> extends SyntheticEvent<T> {
    /** X coordinate relative to viewport */
    clientX: number;
    /** Y coordinate relative to viewport */
    clientY: number;
    /** Mouse button that was pressed */
    button: number;
}

/**
 * Focus event interface
 * 
 * @interface SyntheticFocusEvent
 * @extends SyntheticEvent
 */
interface SyntheticFocusEvent<T = Element> extends SyntheticEvent<T> {
    /** The element that is gaining/losing focus */
    relatedTarget: EventTarget | null;
}

/**
 * Pointer event interface
 * 
 * @interface SyntheticPointerEvent
 * @extends SyntheticMouseEvent
 */
interface SyntheticPointerEvent<T = Element> extends SyntheticMouseEvent<T> {
    /** Pointer ID */
    pointerId: number;
    /** Width of pointer contact area */
    width: number;
    /** Height of pointer contact area */
    height: number;
    /** Pressure (0-1) */
    pressure: number;
    /** Pointer type (mouse, pen, touch) */
    pointerType: 'mouse' | 'pen' | 'touch';
}

/**
 * Touch event interface
 * 
 * @interface SyntheticTouchEvent
 * @extends SyntheticEvent
 */
interface SyntheticTouchEvent<T = Element> extends SyntheticEvent<T> {
    /** Whether the Alt key was pressed */
    altKey: boolean;
    /** Changed touches */
    changedTouches: TouchList;
    /** Whether the Ctrl key was pressed */
    ctrlKey: boolean;
    /** Whether the Meta key was pressed */
    metaKey: boolean;
    /** Whether the Shift key was pressed */
    shiftKey: boolean;
    /** All current touches */
    touches: TouchList;
}

/* ======================== */
/* === Global Attributes === */
/* ======================== */

/**
 * CSS properties type that extends CSSStyleDeclaration
 * 
 * @typedef {Partial<CSSStyleDeclaration> & {[property: string]: string|number|undefined}} CSSProperties
 */
type CSSProperties = Partial<CSSStyleDeclaration> & {
    [property: string]: string | number | undefined;
}

/* ======================== */
/* === Event Interfaces === */
/* ======================== */

/**
 * Clipboard event interface
 * 
 * @interface SyntheticClipboardEvent
 * @extends SyntheticEvent
 */
interface SyntheticClipboardEvent<T = Element> extends SyntheticEvent<T> {
    clipboardData: DataTransfer;
}

/**
 * Composition event interface (for IME input)
 * 
 * @interface SyntheticCompositionEvent
 * @extends SyntheticEvent
 */
interface SyntheticCompositionEvent<T = Element> extends SyntheticEvent<T> {
    data: string;
}

/**
 * UI event interface
 * 
 * @interface SyntheticUIEvent
 * @extends SyntheticEvent
 */
interface SyntheticUIEvent<T = Element> extends SyntheticEvent<T> {
    detail: number;
    view: AbstractView;
}

/**
 * Wheel event interface
 * 
 * @interface SyntheticWheelEvent
 * @extends SyntheticMouseEvent
 */
interface SyntheticWheelEvent<T = Element> extends SyntheticMouseEvent<T> {
    deltaX: number;
    deltaY: number;
    deltaZ: number;
    deltaMode: number;
}

/**
 * Animation event interface
 * 
 * @interface SyntheticAnimationEvent
 * @extends SyntheticEvent
 */
interface SyntheticAnimationEvent<T = Element> extends SyntheticEvent<T> {
    animationName: string;
    elapsedTime: number;
    pseudoElement: string;
}

/**
 * Transition event interface
 * 
 * @interface SyntheticTransitionEvent
 * @extends SyntheticEvent
 */
interface SyntheticTransitionEvent<T = Element> extends SyntheticEvent<T> {
    propertyName: string;
    elapsedTime: number;
    pseudoElement: string;
}

/**
 * Abstract view interface (for UI events)
 * 
 * @interface AbstractView
 */
interface AbstractView {
    document: Document;
    styleMedia: StyleMedia;
}

/* ======================== */
/* === Input/Form Events === */
/* ======================== */

/**
 * Input event interface with input-specific properties
 * 
 * @interface SyntheticInputEvent
 * @extends SyntheticEvent
 */
interface SyntheticInputEvent<T = Element> extends SyntheticEvent<T> {
    data?: string;
    inputType?: string;
    isComposing?: boolean;
}

/**
 * Form event interface with form-specific properties
 * 
 * @interface SyntheticFormEvent
 * @extends SyntheticEvent
 */
interface SyntheticFormEvent<T = Element> extends SyntheticEvent<T> {
    relatedTarget?: EventTarget | null;
}

/* ======================== */
/* === Media Events === */
/* ======================== */

/**
 * Media event interface for audio/video elements
 * 
 * @interface SyntheticMediaEvent
 * @extends SyntheticEvent
 */
interface SyntheticMediaEvent<T = Element> extends SyntheticEvent<T> {
    // Media event properties
}

/* ======================== */
/* === Image Events === */
/* ======================== */

/**
 * Image event interface for load/error events
 * 
 * @interface SyntheticImageEvent
 * @extends SyntheticEvent
 */
interface SyntheticImageEvent<T = Element> extends SyntheticEvent<T> {
    // Image event properties
}

/* ======================== */
/* === Drag Events === */
/* ======================== */

/**
 * Drag event interface
 * 
 * @interface SyntheticDragEvent
 * @extends SyntheticMouseEvent
 */
interface SyntheticDragEvent<T = Element> extends SyntheticMouseEvent<T> {
    dataTransfer: DataTransfer;
}

/**
 * Interface for all possible DOM attributes including:
 * - Standard HTML attributes
 * - Event handlers
 * - Custom data-* and aria-* attributes
 * 
 * @interface DOMAttributes
 */
export interface DOMAttributes {
    /* === Basic HTML Attributes === */
    /** Space-separated class names */
    className?: string;
    /** Unique element identifier */
    id?: string;
    /** Inline CSS styles */
    style?: CSSProperties;
    /** Advisory information */
    title?: string;
    /** Child nodes */
    children?: DOMNode;

    /* === Global HTML Attributes === */
    /** Keyboard shortcut key */
    accessKey?: string;
    /** Whether content is editable */
    contentEditable?: boolean | 'true' | 'false';
    /** Whether element is hidden */
    hidden?: boolean;
    /** Tab order of the element */
    tabIndex?: number;
    /** ARIA role */
    role?: string;
    /** Whether element is draggable */
    draggable?: boolean;
    /** Whether spellchecking is enabled */
    spellcheck?: boolean | 'true' | 'false';
    /** Reactive component callback */
    reactive?: Parameters<typeof Reactive>['0']['callback'];

    /* === Data Attributes === */
    /** Custom data attributes */
    [dataAttr: `data-${string}`]: any;

    /* === ARIA Attributes === */
    /** ARIA accessibility attributes */
    [ariaAttr: `aria-${string}`]: string | undefined;

    /* === Clipboard Events === */
    /** Clipboard copy event handler */
    onCopy?: (event: SyntheticClipboardEvent) => void;
    /** Clipboard cut event handler */
    onCut?: (event: SyntheticClipboardEvent) => void;
    /** Clipboard paste event handler */
    onPaste?: (event: SyntheticClipboardEvent) => void;

    /* === Composition Events === */
    /** Composition end event handler */
    onCompositionEnd?: (event: SyntheticCompositionEvent) => void;
    /** Composition start event handler */
    onCompositionStart?: (event: SyntheticCompositionEvent) => void;
    /** Composition update event handler */
    onCompositionUpdate?: (event: SyntheticCompositionEvent) => void;

    /* === Focus Events === */
    /** Focus event handler */
    onFocus?: (event: SyntheticFocusEvent) => void;
    /** Blur event handler */
    onBlur?: (event: SyntheticFocusEvent) => void;

    /* === Form Events === */
    /** Form change event handler */
    onChange?: (event: SyntheticEvent) => void;
    /** Form reset event handler */
    onReset?: (event: SyntheticEvent) => void;
    /** Form invalid event handler */
    onInvalid?: (event: SyntheticEvent) => void;

    /* === Keyboard Events === */
    /** Key down event handler */
    onKeyDown?: (event: SyntheticKeyboardEvent) => void;
    /** Key press event handler */
    onKeyPress?: (event: SyntheticKeyboardEvent) => void;
    /** Key up event handler */
    onKeyUp?: (event: SyntheticKeyboardEvent) => void;

    /* === Mouse Events === */
    /** Click event handler */
    onClick?: (event: SyntheticMouseEvent) => void;
    /** Context menu event handler */
    onContextMenu?: (event: SyntheticMouseEvent) => void;
    /** Double click event handler */
    onDoubleClick?: (event: SyntheticMouseEvent) => void;
    /** Mouse down event handler */
    onMouseDown?: (event: SyntheticMouseEvent) => void;
    /** Mouse enter event handler */
    onMouseEnter?: (event: SyntheticMouseEvent) => void;
    /** Mouse leave event handler */
    onMouseLeave?: (event: SyntheticMouseEvent) => void;
    /** Mouse move event handler */
    onMouseMove?: (event: SyntheticMouseEvent) => void;
    /** Mouse out event handler */
    onMouseOut?: (event: SyntheticMouseEvent) => void;
    /** Mouse over event handler */
    onMouseOver?: (event: SyntheticMouseEvent) => void;
    /** Mouse up event handler */
    onMouseUp?: (event: SyntheticMouseEvent) => void;

    /* === Pointer Events === */
    /** Pointer down event handler */
    onPointerDown?: (event: SyntheticPointerEvent) => void;
    /** Pointer move event handler */
    onPointerMove?: (event: SyntheticPointerEvent) => void;
    /** Pointer up event handler */
    onPointerUp?: (event: SyntheticPointerEvent) => void;
    /** Pointer cancel event handler */
    onPointerCancel?: (event: SyntheticPointerEvent) => void;
    /** Pointer enter event handler */
    onPointerEnter?: (event: SyntheticPointerEvent) => void;
    /** Pointer leave event handler */
    onPointerLeave?: (event: SyntheticPointerEvent) => void;
    /** Pointer over event handler */
    onPointerOver?: (event: SyntheticPointerEvent) => void;
    /** Pointer out event handler */
    onPointerOut?: (event: SyntheticPointerEvent) => void;

    /* === Selection Events === */
    /** Selection change event handler */
    onSelect?: (event: SyntheticEvent) => void;

    /* === Touch Events === */
    /** Touch start event handler */
    onTouchStart?: (event: SyntheticTouchEvent) => void;
    /** Touch move event handler */
    onTouchMove?: (event: SyntheticTouchEvent) => void;
    /** Touch end event handler */
    onTouchEnd?: (event: SyntheticTouchEvent) => void;
    /** Touch cancel event handler */
    onTouchCancel?: (event: SyntheticTouchEvent) => void;

    /* === UI Events === */
    /** Scroll event handler */
    onScroll?: (event: SyntheticUIEvent) => void;

    /* === Wheel Events === */
    /** Wheel event handler */
    onWheel?: (event: SyntheticWheelEvent) => void;

    /* === Animation Events === */
    /** Animation start event handler */
    onAnimationStart?: (event: SyntheticAnimationEvent) => void;
    /** Animation end event handler */
    onAnimationEnd?: (event: SyntheticAnimationEvent) => void;
    /** Animation iteration event handler */
    onAnimationIteration?: (event: SyntheticAnimationEvent) => void;

    /* === Transition Events === */
    /** Transition end event handler */
    onTransitionEnd?: (event: SyntheticTransitionEvent) => void;

      /* === Drag Events === */
    /** Drag start event handler */
    onDrag?: (event: SyntheticDragEvent) => void;
    /** Drag start event handler */
    onDragStart?: (event: SyntheticDragEvent) => void;
    /** Drag end event handler */
    onDragEnd?: (event: SyntheticDragEvent) => void;
    /** Drag enter event handler */
    onDragEnter?: (event: SyntheticDragEvent) => void;
    /** Drag exit event handler */
    onDragExit?: (event: SyntheticDragEvent) => void;
    /** Drag leave event handler */
    onDragLeave?: (event: SyntheticDragEvent) => void;
    /** Drag over event handler */
    onDragOver?: (event: SyntheticDragEvent) => void;
    /** Drop event handler */
    onDrop?: (event: SyntheticDragEvent) => void;

    /* === Media Events === */
    /** Audio/video abort event handler */
    onAbort?: (event: SyntheticMediaEvent) => void;
    /** Audio/video can play event handler */
    onCanPlay?: (event: SyntheticMediaEvent) => void;
    /** Audio/video can play through event handler */
    onCanPlayThrough?: (event: SyntheticMediaEvent) => void;
    /** Audio/video duration change event handler */
    onDurationChange?: (event: SyntheticMediaEvent) => void;
    /** Audio/video emptied event handler */
    onEmptied?: (event: SyntheticMediaEvent) => void;
    /** Audio/video encrypted event handler */
    onEncrypted?: (event: SyntheticMediaEvent) => void;
    /** Audio/video ended event handler */
    onEnded?: (event: SyntheticMediaEvent) => void;
    /** Audio/video loaded data event handler */
    onLoadedData?: (event: SyntheticMediaEvent) => void;
    /** Audio/video loaded metadata event handler */
    onLoadedMetadata?: (event: SyntheticMediaEvent) => void;
    /** Audio/video load start event handler */
    onLoadStart?: (event: SyntheticMediaEvent) => void;
    /** Audio/video pause event handler */
    onPause?: (event: SyntheticMediaEvent) => void;
    /** Audio/video play event handler */
    onPlay?: (event: SyntheticMediaEvent) => void;
    /** Audio/video playing event handler */
    onPlaying?: (event: SyntheticMediaEvent) => void;
    /** Audio/video progress event handler */
    onProgress?: (event: SyntheticMediaEvent) => void;
    /** Audio/video rate change event handler */
    onRateChange?: (event: SyntheticMediaEvent) => void;
    /** Audio/video seeked event handler */
    onSeeked?: (event: SyntheticMediaEvent) => void;
    /** Audio/video seeking event handler */
    onSeeking?: (event: SyntheticMediaEvent) => void;
    /** Audio/video stalled event handler */
    onStalled?: (event: SyntheticMediaEvent) => void;
    /** Audio/video suspend event handler */
    onSuspend?: (event: SyntheticMediaEvent) => void;
    /** Audio/video time update event handler */
    onTimeUpdate?: (event: SyntheticMediaEvent) => void;
    /** Audio/video volume change event handler */
    onVolumeChange?: (event: SyntheticMediaEvent) => void;
    /** Audio/video waiting event handler */
    onWaiting?: (event: SyntheticMediaEvent) => void;

    /* === Image Events === */
    /** Image load event handler */
    onLoad?: (event: SyntheticImageEvent) => void;
    /** Image error event handler */
    onError?: (event: SyntheticImageEvent) => void;

    /* === Detailed Input Events === */
    /** Input event handler with input-specific data */
    onInput?: (event: SyntheticInputEvent) => void;
    /** Form event handler with form-specific data */
    onSubmit?: (event: SyntheticFormEvent) => void;

    /* === Custom Attributes === */
    /** Allow other string index signatures */
    [attr: string]: any;
}

/* ======================= */
/* === JSX Namespace ==== */
/* ======================= */

/**
 * Options for DOM rendering
 * 
 * @interface RenderDOMOptions
 */
export interface RenderDOMOptions {
    /** Variable name for root element */
    variable?: string;
    /** Prefix for generated variables */
    prefix?: string;
    /** Whether to minify output */
    minify?: boolean;
    /** Whether to create document fragment */
    fragment?: boolean;
}

/**
 * Extended HTML input types
 * 
 * @typedef {string} HTMLInputType
 */
type HTMLInputType =
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week';

declare global {
    namespace JSX {
        /** JSX element type */
        type Element = DOMNode;

        /** Intrinsic element types */
        interface IntrinsicElements {
            /* === Structural Elements === */
            div: DOMAttributes;
            span: DOMAttributes;
            p: DOMAttributes;
            h1: DOMAttributes;
            h2: DOMAttributes;
            h3: DOMAttributes;
            h4: DOMAttributes;
            h5: DOMAttributes;
            h6: DOMAttributes;

            /* === Text Formatting === */
            strong: DOMAttributes;
            em: DOMAttributes;
            small: DOMAttributes;
            mark: DOMAttributes;
            code: DOMAttributes;
            pre: DOMAttributes;
            blockquote: DOMAttributes;
            br: DOMAttributes;
            hr: DOMAttributes;

            /* === List Elements === */
            ul: DOMAttributes;
            ol: DOMAttributes;
            li: DOMAttributes;
            dl: DOMAttributes;
            dt: DOMAttributes;
            dd: DOMAttributes;

            /* === Table Elements === */
            table: DOMAttributes;
            thead: DOMAttributes;
            tbody: DOMAttributes;
            tr: DOMAttributes;
            th: DOMAttributes;
            td: DOMAttributes;

            /* === Semantic Sections === */
            header: DOMAttributes;
            footer: DOMAttributes;
            section: DOMAttributes;
            article: DOMAttributes;
            nav: DOMAttributes;
            main: DOMAttributes;
            aside: DOMAttributes;
            figure: DOMAttributes;
            figcaption: DOMAttributes;

            /* === Interactive Elements === */
            a: {
                href?: string;
                target?: '_blank' | '_self' | '_parent' | '_top' | string;
                rel?: string;
                download?: any;
            } & DOMAttributes;

            button: {
                type?: 'button' | 'submit' | 'reset';
                disabled?: boolean;
                form?: string;
                formAction?: string;
                formMethod?: string;
            } & DOMAttributes;

            /* === Form Elements === */
            form: {
                action?: string;
                method?: 'get' | 'post';
                encType?: string;
                target?: string;
                noValidate?: boolean;
            } & DOMAttributes;

            input: {
                type?: HTMLInputType;
                value?: string | number;
                checked?: boolean;
                disabled?: boolean;
                readOnly?: boolean;
                required?: boolean;
                placeholder?: string;
                autoComplete?: string;
                min?: string | number;
                max?: string | number;
                step?: string | number;
                pattern?: string;
                multiple?: boolean;
                accept?: string;
            } & DOMAttributes;

            textarea: {
                value?: string;
                disabled?: boolean;
                readOnly?: boolean;
                required?: boolean;
                placeholder?: string;
                rows?: number;
                cols?: number;
                wrap?: 'hard' | 'soft';
            } & DOMAttributes;

            select: {
                value?: string | string[];
                disabled?: boolean;
                multiple?: boolean;
                required?: boolean;
                size?: number;
            } & DOMAttributes;

            option: {
                value?: string;
                selected?: boolean;
                disabled?: boolean;
            } & DOMAttributes;

            label: {
                htmlFor?: string;
            } & DOMAttributes;

            fieldset: {
                disabled?: boolean;
                form?: string;
            } & DOMAttributes;

            /* === Media Elements === */
            img: {
                src?: string;
                alt?: string;
                width?: string | number;
                height?: string | number;
                loading?: 'eager' | 'lazy';
                decoding?: 'async' | 'auto' | 'sync';
                crossOrigin?: 'anonymous' | 'use-credentials';
            } & DOMAttributes;

            video: {
                src?: string;
                poster?: string;
                width?: string | number;
                height?: string | number;
                controls?: boolean;
                autoPlay?: boolean;
                loop?: boolean;
                muted?: boolean;
                playsInline?: boolean;
            } & DOMAttributes;

            audio: {
                src?: string;
                controls?: boolean;
                autoPlay?: boolean;
                loop?: boolean;
                muted?: boolean;
            } & DOMAttributes;

            /* === Script and Meta Elements === */
            script: {
                client?: (props: Record<string, any>) => void;
                props?: Record<string, any>;
                id?: string;
                src?: string;
                type?: string;
                defer?: boolean;
                async?: boolean;
                crossOrigin?: 'anonymous' | 'use-credentials';
                integrity?: string;
            } & DOMAttributes;

            link: {
                href?: string;
                rel?: string;
                type?: string;
                media?: string;
                crossOrigin?: 'anonymous' | 'use-credentials';
                integrity?: string;
            } & DOMAttributes;

            meta: {
                name?: string;
                content?: string;
                charset?: string;
                httpEquiv?: string;
            } & DOMAttributes;

            /* === SVG Elements === */
            svg: {
                width?: string | number;
                height?: string | number;
                viewBox?: string;
                fill?: string;
                xmlns?: string;
            } & DOMAttributes;

            path: {
                d?: string;
                fill?: string;
                stroke?: string;
            } & DOMAttributes;

            /* === Custom Elements === */
            [element: string]: DOMAttributes;
        }

        /** Children attribute type */
        interface ElementChildrenAttribute {
            children: {};
        }

        /** Props attribute type */
        interface ElementAttributesProperty {
            props: {};
        }
    }
}