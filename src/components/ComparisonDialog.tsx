import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CandidateResult {
  id: string;
  name: string;
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
}

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: CandidateResult[];
}

export const ComparisonDialog = ({
  open,
  onOpenChange,
  candidates,
}: ComparisonDialogProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/20";
    if (score >= 60) return "bg-accent/10 border-accent/20";
    return "bg-destructive/10 border-destructive/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Candidate Comparison</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of {candidates.length} selected candidates
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className={`grid gap-4 ${
            candidates.length === 2 ? 'grid-cols-2' : 
            candidates.length === 3 ? 'grid-cols-3' : 
            candidates.length === 4 ? 'grid-cols-2' :
            candidates.length === 5 ? 'grid-cols-3' :
            'grid-cols-3'
          }`}>
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{candidate.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={`${getScoreBgColor(candidate.score)} ${getScoreColor(
                      candidate.score
                    )} font-bold text-lg w-fit`}
                  >
                    {candidate.score}%
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  {/* Summary */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">
                      AI Summary
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {candidate.summary}
                    </p>
                  </div>

                  {/* Matching Skills */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      Matching Skills
                      <span className="text-xs text-success font-normal">
                        ({candidate.matchingSkills.length})
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matchingSkills.length > 0 ? (
                        candidate.matchingSkills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-success/10 text-success border-success/20 text-xs"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None</p>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      Missing Skills
                      <span className="text-xs text-destructive font-normal">
                        ({candidate.missingSkills.length})
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.missingSkills.length > 0 ? (
                        candidate.missingSkills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-destructive/10 text-destructive border-destructive/20 text-xs"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None</p>
                      )}
                    </div>
                  </div>

                  {/* Extra Skills */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                      Extra Skills
                      <span className="text-xs text-accent font-normal">
                        ({candidate.extraSkills.length})
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.extraSkills.length > 0 ? (
                        candidate.extraSkills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-accent/10 text-accent border-accent/20 text-xs"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">None</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
