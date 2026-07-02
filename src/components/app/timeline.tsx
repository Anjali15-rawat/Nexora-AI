import { CheckCircle2, AlertCircle, TrendingUp, RefreshCw, Zap } from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "seo" | "competitor" | "opportunity" | "system" | "action";
}

export function GrowthTimeline({ events }: { events: TimelineEvent[] }) {
  const getIcon = (type: string) => {
    switch (type) {
      case "seo": return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "competitor": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "opportunity": return <Zap className="h-4 w-4 text-yellow-500" />;
      case "action": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4 relative">
          {index !== events.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-border/50"></div>
          )}
          <div className="mt-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border border-border">
            {getIcon(event.type)}
          </div>
          <div>
            <h4 className="text-sm font-medium">{event.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
            <span className="text-[10px] text-muted-foreground mt-2 block">{event.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
