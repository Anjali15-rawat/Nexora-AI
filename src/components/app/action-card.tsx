import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, X } from "lucide-react";

export interface ActionCardProps {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  impact: string;
  difficulty: string;
  onComplete?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAskAdvisor?: (title: string, description: string) => void;
}

export function ActionCard({
  id,
  title,
  description,
  priority,
  impact,
  difficulty,
  onComplete,
  onDismiss,
  onAskAdvisor,
}: ActionCardProps) {
  return (
    <Card className="flex flex-col h-full bg-card hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline" 
            className={
              priority === "High" ? "border-red-500 text-red-500" :
              priority === "Medium" ? "border-yellow-500 text-yellow-500" :
              "border-green-500 text-green-500"
            }
          >
            {priority} Priority
          </Badge>
          <div className="flex gap-1 text-xs text-muted-foreground font-medium">
            <span className="bg-muted px-2 py-1 rounded-md">Impact: {impact}</span>
            <span className="bg-muted px-2 py-1 rounded-md">Diff: {difficulty}</span>
          </div>
        </div>
        <CardTitle className="text-lg mt-3 leading-tight">{title}</CardTitle>
        <CardDescription className="text-sm mt-1">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto pt-4 flex gap-2 border-t border-border/50">
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1 bg-primary text-primary-foreground text-xs h-8"
          onClick={() => onComplete?.(id)}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Mark Complete
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1 text-xs h-8"
          onClick={() => onAskAdvisor?.(title, description)}
        >
          <Sparkles className="w-3 h-3 mr-1 text-primary" />
          Ask Advisor
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDismiss?.(id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
