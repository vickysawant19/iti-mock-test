import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  BookOpen,
  FileText,
  PlusCircle,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ModuleList = ({
  syllabus = [],
  setModuleId,
  setTopicId,
  topicId,
  moduleId,
  setShow,
  itemRefs,
  loading,
}) => {
  const [expandedModule, setExpandedModule] = useState(null);

  // Utility function for className merging
  const cn = (...classes) => classes.filter(Boolean).join(' ');

  const toggleModule = (id) => {
    setExpandedModule(expandedModule === id ? null : id);
  };

  const sortedSyllabus = [...syllabus].sort((a, b) => {
    const matchA = a.moduleId?.match(/\d+/);
    const matchB = b.moduleId?.match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : 0;
    const numB = matchB ? parseInt(matchB[0], 10) : 0;
    return numA - numB;
  });

  const handleModuleClick = (module) => {
    toggleModule(module.moduleId);
    setModuleId(module.moduleId);
    setShow(new Set().add("showModules"));
    setTopicId("");
  };

  const handleTopicClick = (module, topic) => {
    setModuleId(module.moduleId);
    setTopicId(topic.topicId);
    setShow(new Set().add("showTopics"));
  };

  const handleAddModule = () => {
    setShow(new Set().add("AddModules"));
    setModuleId("");
    setTopicId("");
  };

  const handleAddTopic = (e) => {
    e.stopPropagation();
    setShow(new Set().add("AddTopics"));
    setTopicId("");
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="shrink-0 border-b bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Course Modules
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {syllabus.length} {syllabus.length === 1 ? "module" : "modules"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 space-y-3">
          {sortedSyllabus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-muted rounded-full mb-4">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No modules yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                Get started by adding your first module to begin organizing your course content
              </p>
              <Button onClick={handleAddModule} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Module
              </Button>
            </div>
          ) : (
            sortedSyllabus.map((module, index) => {
              const isExpanded = expandedModule === module.moduleId;
              const isSelected = moduleId === module.moduleId;
              const topicCount = module.topics?.length || 0;

              return (
                <Collapsible
                  key={module.moduleId || index}
                  open={isExpanded}
                  onOpenChange={() => toggleModule(module.moduleId)}
                >
                  <div
                    className={cn(
                      "group rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    {/* Module Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => handleModuleClick(module)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isSelected
                              ? "bg-primary/20"
                              : "bg-muted group-hover:bg-primary/10"
                          )}
                        >
                          <BookOpen
                            className={cn(
                              "h-5 w-5",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            ref={(el) => {
                              if (itemRefs?.current) {
                                itemRefs.current[module.moduleId] = el;
                              }
                            }}
                            className={cn(
                              "font-semibold text-base leading-tight",
                              isSelected
                                ? "text-primary"
                                : "text-foreground"
                            )}
                          >
                            {module.moduleId?.toUpperCase()} {module.moduleName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {topicCount} {topicCount === 1 ? "topic" : "topics"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    {/* Topics Dropdown */}
                    <CollapsibleContent>
                      <div className="border-t bg-muted/30 rounded-b-xl">
                        <div className="p-4 space-y-2">
                          {topicCount === 0 ? (
                            <div className="text-center py-6">
                              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-3">
                                No topics added yet
                              </p>
                            </div>
                          ) : (
                            module.topics.map((topic, topicIndex) => {
                              const isTopicSelected = topicId === topic.topicId;
                              return (
                                <div
                                  key={topic.topicId || topicIndex}
                                  onClick={() => handleTopicClick(module, topic)}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-2",
                                    isTopicSelected
                                      ? "bg-primary/10 border-primary shadow-sm"
                                      : "bg-background border-transparent hover:border-primary/30 hover:bg-accent"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "p-1.5 rounded",
                                      isTopicSelected
                                        ? "bg-primary/20"
                                        : "bg-muted"
                                    )}
                                  >
                                    <FileText
                                      className={cn(
                                        "h-4 w-4",
                                        isTopicSelected
                                          ? "text-primary"
                                          : "text-muted-foreground"
                                      )}
                                    />
                                  </div>
                                  <span
                                    className={cn(
                                      "font-medium text-sm flex-1",
                                      isTopicSelected
                                        ? "text-primary"
                                        : "text-foreground"
                                    )}
                                  >
                                    {topic.topicId} - {topic.topicName}
                                  </span>
                                </div>
                              );
                            })
                          )}

                          <Button
                            onClick={handleAddTopic}
                            variant="outline"
                            className="w-full mt-3 border-dashed border-2 gap-2 hover:border-solid"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Topic</span>
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleList;