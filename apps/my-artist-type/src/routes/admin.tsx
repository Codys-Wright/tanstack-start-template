import { Result, useAtomSet, useAtomValue } from '@effect-atom/atom-react';
import { HydrationBoundary } from '@effect-atom/atom-react/ReactHydration';
import {
  AdminSidebar,
  adminSidebarVisibleAtom,
  AnalysisChart,
  analysesAtom,
  combineResponseWithAnalysis,
  loadAdmin,
  responsesAtom,
  ResponsesOverTimeChart,
  ResponsesTable,
  ResponseStatsCards,
  type AdminLoaderData,
  type AnalysisResult,
  type QuizResponse,
} from '@quiz';
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { Button, SidebarInset, SidebarProvider } from '@shadcn';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon } from 'lucide-react';
import React from 'react';

// ============================================================================
// Admin Layout Content (inside HydrationBoundary)
// ============================================================================

const AdminLayoutContent: React.FC = () => {
  const location = useLocation();

  // Check if we're on the quiz-editor route
  const isQuizEditorRoute = location.pathname === '/admin/quiz-editor';

  // Control sidebar state with atom - prevent hydration mismatch
  const [isHydrated, setIsHydrated] = React.useState(false);
  const sidebarOpen = useAtomValue(adminSidebarVisibleAtom) as boolean;
  const setSidebarOpen = useAtomSet(adminSidebarVisibleAtom) as (value: boolean) => void;

  // Prevent hydration mismatch by waiting for client hydration
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get actual responses data from the atom
  const responsesResult = useAtomValue(responsesAtom) as Result.Result<
    ReadonlyArray<QuizResponse>,
    unknown
  >;
  const analysisResult = useAtomValue(analysesAtom) as Result.Result<
    ReadonlyArray<AnalysisResult>,
    unknown
  >;

  // Combine response and analysis data
  const combinedData = React.useMemo(() => {
    if (Result.isSuccess(responsesResult) && Result.isSuccess(analysisResult)) {
      return combineResponseWithAnalysis(responsesResult.value, analysisResult.value);
    }
    return [] as const;
  }, [responsesResult, analysisResult]);

  return (
    <SidebarProvider open={isHydrated ? sidebarOpen : true} onOpenChange={setSidebarOpen}>
      <AdminSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div
              className={`flex flex-col gap-4 ${
                !isQuizEditorRoute ? 'py-4 md:py-6' : ''
              } md:gap-6 relative`}
            >
              {!isQuizEditorRoute && (
                <>
                  {/* Sidebar Toggle Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSidebarOpen(!sidebarOpen);
                    }}
                    className="absolute top-4 left-4 z-10 h-8 w-8 p-0"
                    title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                  >
                    {sidebarOpen ? (
                      <ChevronLeftIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Go To Editor Button */}
                  <Link to="/admin/quiz-editor">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-4 right-4 z-10 h-8 px-3"
                      title="Go to Quiz Editor"
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      Go To Editor
                    </Button>
                  </Link>
                  {/* Response Statistics */}
                  <div className="px-4 lg:px-6 pt-12">
                    <h2 className="text-xl font-semibold mb-4">Response Statistics</h2>
                    <ResponseStatsCards responsesResult={responsesResult} />
                  </div>

                  {/* Charts Section */}
                  <div className="px-4 lg:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                      {/* Analysis Chart */}
                      <div className="lg:col-span-3">
                        <AnalysisChart />
                      </div>

                      {/* Responses Over Time Chart */}
                      <div className="lg:col-span-7">
                        <ResponsesOverTimeChart />
                      </div>
                    </div>
                  </div>

                  {/* Responses Table */}
                  <div className="px-4 lg:px-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Responses</h2>
                    {Result.isSuccess(responsesResult) && Result.isSuccess(analysisResult) ? (
                      <ResponsesTable data={combinedData} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading responses and analysis data...
                      </div>
                    )}
                  </div>
                </>
              )}

              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

// ============================================================================
// Admin Layout with Hydration
// ============================================================================

interface AdminLayoutProps {
  loaderData: AdminLoaderData;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ loaderData }) => {
  const hydrationState = [loaderData.responses, loaderData.analyses];
  return (
    <HydrationBoundary state={hydrationState}>
      <AdminLayoutContent />
    </HydrationBoundary>
  );
};

// ============================================================================
// Route Definition
// ============================================================================

export const Route = createFileRoute('/admin')({
  loader: () => loadAdmin(),
  component: AdminPageWrapper,
});

function AdminPageWrapper() {
  const loaderData = Route.useLoaderData();
  return <AdminLayout loaderData={loaderData} />;
}
