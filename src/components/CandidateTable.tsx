import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CandidateResult {
  id: string;
  name: string;
  score: number;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  extraSkills: string[];
}

interface CandidateTableProps {
  candidates: CandidateResult[];
  selectedCandidates?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const CandidateTable = ({ 
  candidates, 
  selectedCandidates = [], 
  onSelectionChange 
}: CandidateTableProps) => {
  const [sortedCandidates, setSortedCandidates] = useState(
    [...candidates].sort((a, b) => b.score - a.score)
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleSort = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(newOrder);
    setSortedCandidates(
      [...sortedCandidates].sort((a, b) =>
        newOrder === "desc" ? b.score - a.score : a.score - b.score
      )
    );
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSelectCandidate = (id: string) => {
    if (!onSelectionChange) return;
    
    const newSelection = selectedCandidates.includes(id)
      ? selectedCandidates.filter(candidateId => candidateId !== id)
      : selectedCandidates.length < 6
        ? [...selectedCandidates, id]
        : selectedCandidates;
    
    onSelectionChange(newSelection);
  };

  return (
    <div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              {onSelectionChange && <TableHead className="w-12"></TableHead>}
              <TableHead>Candidate</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={toggleSort}
                  className="gap-2 hover:bg-transparent"
                >
                  Match %
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </TableHead>
              <TableHead>AI Summary</TableHead>
              <TableHead>Key Strengths</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {sortedCandidates.map((candidate) => (
            <>
              <TableRow key={candidate.id} className="hover:bg-muted/50">
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRow(candidate.id)}
                  >
                    {expandedRows.has(candidate.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      checked={selectedCandidates.includes(candidate.id)}
                      onCheckedChange={() => handleSelectCandidate(candidate.id)}
                      disabled={
                        !selectedCandidates.includes(candidate.id) && 
                        selectedCandidates.length >= 6
                      }
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium text-foreground">
                  {candidate.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getScoreBgColor(candidate.score)} ${getScoreColor(
                      candidate.score
                    )} font-bold`}
                  >
                    {candidate.score}%
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {candidate.summary}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {candidate.matchingSkills.slice(0, 3).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-success/10 text-success border-success/20 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
              {expandedRows.has(candidate.id) && (
                <TableRow>
                  <TableCell colSpan={onSelectionChange ? 6 : 5} className="bg-muted/30">
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Full Summary</h4>
                        <p className="text-sm text-muted-foreground">{candidate.summary}</p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            Matching Skills
                            <span className="text-xs text-success">
                              ({candidate.matchingSkills.length})
                            </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.matchingSkills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-success/10 text-success border-success/20"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            Missing Skills
                            <span className="text-xs text-destructive">
                              ({candidate.missingSkills.length})
                            </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.missingSkills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-destructive/10 text-destructive border-destructive/20"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            Extra Skills
                            <span className="text-xs text-accent">
                              ({candidate.extraSkills.length})
                            </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.extraSkills.map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-accent/10 text-accent border-accent/20"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </Card>
    
    {/* Legend */}
    <div className="mt-2 text-[11px] text-muted-foreground">
      Legend: <span className="text-emerald-600 font-medium">Matching</span> • 
      <span className="text-rose-600 font-medium ml-2">Missing</span> • 
      <span className="text-sky-600 font-medium ml-2">Extra</span>
    </div>
    </div>
  );
};
