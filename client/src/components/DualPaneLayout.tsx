import { FC, ReactNode } from 'react';

interface DualPaneLayoutProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
}

export const DualPaneLayout: FC<DualPaneLayoutProps> = ({ leftPane, rightPane }) => {
  return (
    <div className="dual-pane">
      <section className="left-pane" aria-label="Whiteboard Drawing and Recommendations">
        {leftPane}
      </section>
      <section className="right-pane" aria-label="Interactive Workflow Canvas">
        {rightPane}
      </section>
    </div>
  );
};
