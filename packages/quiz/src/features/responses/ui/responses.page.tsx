import { useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import { Badge, Button, Card } from '@shadcn';
import React from 'react';
import { responsesAtom } from '../client/atoms.js';

// PageContainer component with padding and layout
type PageContainerProps = {
  children: React.ReactNode;
};

const PageContainer: React.FC<PageContainerProps> = ({ children }) => (
  <div className="container mx-auto px-4 py-8 max-w-6xl">{children}</div>
);

// Responses page component
export const ResponsesPage: React.FC = () => {
  const responsesResult = useAtomValue(responsesAtom);
  const refreshResponses = useAtomRefresh(responsesAtom);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quiz Responses</h1>
            <p className="text-muted-foreground">
              View and manage all quiz responses submitted by users.
            </p>
          </div>
          <Button onClick={refreshResponses} variant="outline">
            Refresh
          </Button>
        </div>

        {/* Responses List */}
        <div className="space-y-4">
          {responsesResult._tag === 'Success' ? (
            responsesResult.value.length > 0 ? (
              responsesResult.value.map((response) => (
                <Card key={response.id} className="w-full">
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <div>
                        <Card.Title className="text-lg">
                          Response {response.id.slice(0, 8)}...
                        </Card.Title>
                        <Card.Description>Quiz ID: {response.quizId}</Card.Description>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{response.answers?.length ?? 0} answers</Badge>
                        <Badge variant="outline">
                          {new Date(response.createdAt.epochMillis).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="space-y-3">
                      {/* Session Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Started:</span>{' '}
                          {new Date(
                            response.sessionMetadata.startedAt.epochMillis,
                          ).toLocaleString()}
                        </div>
                        {response.sessionMetadata.completedAt !== undefined && (
                          <div>
                            <span className="font-medium">Completed:</span>{' '}
                            {new Date(
                              response.sessionMetadata.completedAt.epochMillis,
                            ).toLocaleString()}
                          </div>
                        )}
                        {response.sessionMetadata.totalDurationMs !== undefined &&
                          response.sessionMetadata.totalDurationMs > 0 && (
                            <div>
                              <span className="font-medium">Duration:</span>{' '}
                              {Math.round(response.sessionMetadata.totalDurationMs / 1000)}s
                            </div>
                          )}
                        {response.sessionMetadata.userAgent !== undefined &&
                          response.sessionMetadata.userAgent.length > 0 && (
                            <div>
                              <span className="font-medium">User Agent:</span>{' '}
                              <span className="text-xs text-muted-foreground">
                                {response.sessionMetadata.userAgent.slice(0, 50)}
                                ...
                              </span>
                            </div>
                          )}
                      </div>

                      {/* Answers Summary */}
                      {response.answers !== undefined && response.answers.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Answers:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {response.answers.map((answer, index) => (
                              <div key={index} className="bg-muted p-2 rounded text-sm">
                                <div className="font-medium">
                                  Q{index + 1}: {answer.questionId.slice(0, 8)}...
                                </div>
                                <div>Value: {answer.value}</div>
                                {answer.answeredAt !== undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(answer.answeredAt.epochMillis).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interaction Logs Summary */}
                      {response.interactionLogs !== undefined &&
                        response.interactionLogs.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">
                              Interactions ({response.interactionLogs.length}):
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {response.interactionLogs.map((log, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {log.type}
                                  {log.questionId !== undefined &&
                                    log.questionId.length > 0 &&
                                    ` (${log.questionId.slice(0, 4)})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Card>
                <Card.Content className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">No responses found</h3>
                    <p className="text-muted-foreground">
                      No quiz responses have been submitted yet.
                    </p>
                  </div>
                </Card.Content>
              </Card>
            )
          ) : (
            <Card>
              <Card.Content className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Loading responses...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch the responses.</p>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
