import type { WidgetConfig } from "@/lib/config/types";
import { getComponent } from "./component-registry";

interface PageRendererProps {
  layout: WidgetConfig[];
  orgId: string;
}

export function PageRenderer({ layout, orgId }: PageRendererProps) {
  if (!layout || layout.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#5A534D] text-sm">
        No widgets configured for this page.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 auto-rows-min">
      {layout.map((widget) => {
        const Component = getComponent(widget.type);
        if (!Component) {
          return (
            <div
              key={widget.id}
              className="rounded-lg border border-[#2A2520] bg-[#1A1816] p-4 text-xs text-[#5A534D]"
              style={{
                gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
                gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
              }}
            >
              Unknown widget: {widget.type}
            </div>
          );
        }

        return (
          <div
            key={widget.id}
            style={{
              gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
              gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
            }}
          >
            <Component {...widget.props} orgId={orgId} widgetId={widget.id} />
          </div>
        );
      })}
    </div>
  );
}
