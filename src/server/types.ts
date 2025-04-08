/* ====================== */
/* === Core DOM Types === */
/* ====================== */

import type { Reactive } from "../client";

/**
 * DOM node can be:
 * - Primitive (string, number, boolean, null, undefined)
 * - DOM element
 * - Array of DOM nodes
 * - Promise resolving to any of the above
 */
export type DOMNode =
    | PrimitiveNode
    | DOMElement
    | DOMNode[]
    | Promise<unknown>;

export type PrimitiveNode = string | number | boolean | null | undefined;

export interface DOMElement {
    type: string | FunctionComponent;
    props: DOMAttributes;
    children: DOMNode[];
}

export type FunctionComponent<P extends DOMAttributes = DOMAttributes> = (props: P) => DOMNode;

/* ======================== */
/* === Global Attributes === */
/* ======================== */

export interface DOMAttributes {
    // Basic attributes
    className?: string;
    id?: string;
    style?: CSSProperties;
    title?: string;
    children?: DOMNode;

    // Global HTML attributes
    accessKey?: string;
    contentEditable?: boolean | 'true' | 'false';
    hidden?: boolean;
    tabIndex?: number;
    role?: string;
    draggable?: boolean;
    spellcheck?: boolean | 'true' | 'false';
    reactive?: Parameters<typeof Reactive>['0']['callback'];

    // Data attributes
    [dataAttr: `data-${string}`]: any;

    // Aria attributes
    [ariaAttr: `aria-${string}`]: string | undefined;

    // Event handlers
    onClick?: (event: SyntheticEvent) => void;
    onChange?: (event: SyntheticEvent) => void;
    onInput?: (event: SyntheticEvent) => void;
    onSubmit?: (event: SyntheticEvent) => void;
    onKeyDown?: (event: SyntheticKeyboardEvent) => void;
    onKeyUp?: (event: SyntheticKeyboardEvent) => void;
    onMouseEnter?: (event: SyntheticMouseEvent) => void;
    onMouseLeave?: (event: SyntheticMouseEvent) => void;
    onFocus?: (event: SyntheticFocusEvent) => void;
    onBlur?: (event: SyntheticFocusEvent) => void;

    // Custom attributes
    [attr: string]: any;
}

type CSSProperties = Partial<CSSStyleDeclaration> & {
    [property: string]: string | number | undefined;
}

interface SyntheticEvent<T = Element> {
    currentTarget: T;
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
    nativeEvent: Event;
}

interface SyntheticKeyboardEvent<T = Element> extends SyntheticEvent<T> {
    key: string;
    code: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
}

interface SyntheticMouseEvent<T = Element> extends SyntheticEvent<T> {
    clientX: number;
    clientY: number;
    button: number;
}

interface SyntheticFocusEvent<T = Element> extends SyntheticEvent<T> {
    relatedTarget: EventTarget | null;
}

/* ======================= */
/* === JSX Namespace ==== */
/* ======================= */

declare global {
    namespace JSX {
        type Element = DOMNode;

        interface IntrinsicElements {
            // Structural elements
            div: DOMAttributes;
            span: DOMAttributes;
            p: DOMAttributes;
            h1: DOMAttributes;
            h2: DOMAttributes;
            h3: DOMAttributes;
            h4: DOMAttributes;
            h5: DOMAttributes;
            h6: DOMAttributes;

            // Text formatting
            strong: DOMAttributes;
            em: DOMAttributes;
            small: DOMAttributes;
            mark: DOMAttributes;
            code: DOMAttributes;
            pre: DOMAttributes;
            blockquote: DOMAttributes;
            br: DOMAttributes;
            hr: DOMAttributes;

            // Lists
            ul: DOMAttributes;
            ol: DOMAttributes;
            li: DOMAttributes;
            dl: DOMAttributes;
            dt: DOMAttributes;
            dd: DOMAttributes;

            // Tables
            table: DOMAttributes;
            thead: DOMAttributes;
            tbody: DOMAttributes;
            tr: DOMAttributes;
            th: DOMAttributes;
            td: DOMAttributes;

            // Semantic sections
            header: DOMAttributes;
            footer: DOMAttributes;
            section: DOMAttributes;
            article: DOMAttributes;
            nav: DOMAttributes;
            main: DOMAttributes;
            aside: DOMAttributes;
            figure: DOMAttributes;
            figcaption: DOMAttributes;

            // Interactive elements
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

            // Form elements
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

            // Media elements
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

            // Script and meta elements
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

            // SVG elements
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

            // Allow unknown elements
            [element: string]: DOMAttributes;
        }

        interface ElementChildrenAttribute {
            children: {};
        }

        interface ElementAttributesProperty {
            props: {};
        }
    }
}

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