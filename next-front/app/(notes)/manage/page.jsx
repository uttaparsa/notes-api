"use client";

import React, { useContext, useEffect } from "react";
import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";
import {
  NoteListContext,
  WorkspaceContext,
  ToastContext,
  SelectedWorkspaceContext,
} from "../layout";
import CategorySection from "./components/CategorySection";
import WorkspaceSection from "./components/WorkspaceSection";

export default function CategoryList() {
  const noteLists = useContext(NoteListContext);
  const workspaces = useContext(WorkspaceContext);
  const { selectedWorkspace } = useContext(SelectedWorkspaceContext);
  const showToast = useContext(ToastContext);

  useEffect(() => {
    window.dispatchEvent(new Event("updateNoteLists"));
    window.dispatchEvent(new Event("updateWorkspaces"));
  }, []);

  return (
    <Container className="py-4">
      <h2 className="mb-4">Manage Categories and Workspaces</h2>
      <Row>
        <Col md={6}>
          <CategorySection
            noteLists={noteLists}
            selectedWorkspace={selectedWorkspace}
            showToast={showToast}
          />
        </Col>

        <Col md={6}>
          <WorkspaceSection workspaces={workspaces} showToast={showToast} />
        </Col>
      </Row>
    </Container>
  );
}
