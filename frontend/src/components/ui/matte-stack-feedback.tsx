"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./matte-stack-feedback.css";

export interface MatteStackFeedbackItem {
  title: string;
  detail: string;
}

export interface MatteStackFeedbackProps {
  /** Notifications visible on mount. */
  initialItems?: MatteStackFeedbackItem[];

  /** Maximum number of cards shown at once. */
  maxVisible?: number;

  /** Maximum number of notifications held in the overflow queue. */
  maxQueued?: number;

  /** Shows the Add notification / Clear demo controls. */
  showDemoControls?: boolean;

  className?: string;
}

type StackItem = MatteStackFeedbackItem & {
  id: number;
  visible: boolean;
};

const CHECK_PATH = "m5 12 4 4L19 6";
const CLOSE_PATH = "m6 6 12 12M6 18 18 6";
const DISMISS_MS = 300;

const DEFAULT_ITEMS: MatteStackFeedbackItem[] = [
  {
    title: "Export ready",
    detail: "Your assets are prepared.",
  },
  {
    title: "Comment added",
    detail: "A new note on the project.",
  },
  {
    title: "Invite accepted",
    detail: "Your team is up to date.",
  },
];

export default function MatteStackFeedback({
  initialItems = DEFAULT_ITEMS,
  maxVisible = 3,
  maxQueued = 20,
  showDemoControls = true,
  className = "",
}: MatteStackFeedbackProps) {
  const itemsRef = useRef<StackItem[]>(
    initialItems.map((item, index) => ({
      ...item,
      id: index + 1,
      visible: true,
    })),
  );

  const queueRef = useRef<MatteStackFeedbackItem[]>([]);
  const serialRef = useRef(initialItems.length);
  const addedRef = useRef(0);

  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set(),
  );

  const [, forceRender] = useState(0);
  const [live, setLive] = useState("");
  const [error, setError] = useState("");

  const rerender = useCallback(() => {
    forceRender((n) => n + 1);
  }, []);

  const reducedMotion = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      Boolean(
        window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches,
      )
    );
  }, []);

  const announce = useCallback(
    (text: string, isError = false) => {
      if (isError) {
        setError(text);
        setLive("");
      } else {
        setLive(text);
        setError("");
      }
    },
    [],
  );

  const queueLabel = useCallback(() => {
    const count = itemsRef.current.length;
    const queued = queueRef.current.length;

    return queued
      ? `${count} visible · ${queued} queued`
      : `${count} notification${count === 1 ? "" : "s"}`;
  }, []);

  const appendMessage = useCallback(
    (
      message: MatteStackFeedbackItem,
      animate = true,
    ) => {
      const id = ++serialRef.current;

      itemsRef.current = [
        ...itemsRef.current,
        {
          ...message,
          id,
          visible: !(animate && !reducedMotion()),
        },
      ];

      rerender();

      if (animate && !reducedMotion()) {
        requestAnimationFrame(() => {
          itemsRef.current = itemsRef.current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  visible: true,
                }
              : item,
          );

          rerender();
        });
      }
    },
    [reducedMotion, rerender],
  );

  const push = useCallback(
    (
      message: Partial<MatteStackFeedbackItem> = {},
    ) => {
      const title =
        message.title ?? "New notification";

      const detail =
        message.detail ??
        "An update to your workspace.";

      if (itemsRef.current.length < maxVisible) {
        appendMessage({
          title,
          detail,
        });
      } else if (
        queueRef.current.length < maxQueued
      ) {
        queueRef.current = [
          ...queueRef.current,
          {
            title,
            detail,
          },
        ];

        rerender();
      } else {
        announce(
          "Notification queue is full.",
          true,
        );

        return false;
      }

      announce(
        queueRef.current.length
          ? "Notification added to the queue."
          : title,
      );

      return true;
    },
    [
      announce,
      appendMessage,
      maxVisible,
      maxQueued,
      rerender,
    ],
  );

  const dismissItem = useCallback(
    (id: number) => {
      const item = itemsRef.current.find(
        (it) => it.id === id,
      );

      if (!item || !item.visible) {
        return;
      }

      itemsRef.current = itemsRef.current.map(
        (it) =>
          it.id === id
            ? {
                ...it,
                visible: false,
              }
            : it,
      );

      rerender();

      const delay = reducedMotion()
        ? 0
        : DISMISS_MS;

      const timer = setTimeout(() => {
        timersRef.current.delete(timer);

        itemsRef.current =
          itemsRef.current.filter(
            (it) => it.id !== id,
          );

        if (queueRef.current.length) {
          const [next, ...rest] =
            queueRef.current;

          queueRef.current = rest;

          appendMessage(next);
        } else {
          rerender();
        }
      }, delay);

      timersRef.current.add(timer);
    },
    [
      appendMessage,
      reducedMotion,
      rerender,
    ],
  );

  const clear = useCallback(() => {
    queueRef.current = [];

    for (const item of itemsRef.current) {
      if (item.visible) {
        dismissItem(item.id);
      }
    }

    announce("Notifications cleared.");
  }, [announce, dismissItem]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) {
        clearTimeout(timer);
      }

      timersRef.current.clear();
    };
  }, []);

  const handleAdd = useCallback(() => {
    addedRef.current += 1;

    push({
      title: `Project update ${addedRef.current}`,
      detail:
        "A new activity in your workspace.",
    });
  }, [push]);

  return (
    <div
      className={`fb-demo ${className}`.trim()}
      data-feedback="stack"
      tabIndex={-1}
    >
      <div className="fb-scene">
        <div
          className="fb-stack"
          data-stack
        >
          {itemsRef.current.map((item) => (
            <div
              className="fb-stack-item"
              data-visible={
                item.visible
                  ? "true"
                  : "false"
              }
              key={item.id}
            >
              <div className="fb-stack-clip">
                <div className="fb-card fb-message">
                  <span className="fb-icon">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d={CHECK_PATH} />
                    </svg>
                  </span>

                  <div className="fb-copy">
                    <h3 data-title>
                      {item.title}
                    </h3>

                    <p data-detail>
                      {item.detail}
                    </p>
                  </div>

                  <button
                    className="fb-close"
                    type="button"
                    data-action="dismiss-item"
                    aria-label="Dismiss notification"
                    onClick={() =>
                      dismissItem(item.id)
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d={CLOSE_PATH} />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p
        className="fb-queue"
        data-queue
      >
        {queueLabel()}
      </p>

      {showDemoControls && (
        <>
          <div className="fb-tools">
            <button
              type="button"
              className="fb-button"
              data-demo="add"
              onClick={handleAdd}
            >
              Add notification
            </button>

            <button
              type="button"
              className="fb-button fb-button--quiet"
              data-demo="clear"
              onClick={clear}
            >
              Clear
            </button>
          </div>

          <p className="fb-caption">
            Three visible at once. The rest wait in
            line.
          </p>
        </>
      )}

      <span
        className="fb-sr"
        data-live
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {live}
      </span>

      <span
        className="fb-sr"
        data-error
        role="alert"
        aria-atomic="true"
      >
        {error}
      </span>
    </div>
  );
}