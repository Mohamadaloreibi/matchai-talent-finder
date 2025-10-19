import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MatchResultData {
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
}

interface HistoryItem {
  id: string;
  timestamp: number;
  score: number;
  cvName?: string;
  result: MatchResultData;
}

interface MatchHistoryProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectMatch: (item: HistoryItem) => void;
}

export const MatchHistory = ({ history, onClearHistory, onSelectMatch }: MatchHistoryProps) => {
  if (history.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent";
    return "text-destructive";
  };

  return (
    <Card className="p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Recent Matches</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-3">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectMatch(item)}
              className="w-full text-left p-4 rounded-lg border border-border hover:border-primary transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    {item.cvName || 'Match Result'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleDateString()} at{' '}
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                  {item.score}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
