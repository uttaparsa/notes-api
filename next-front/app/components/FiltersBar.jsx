"use client";

import { useState, useEffect } from "react";
import { Form, FormCheck, Collapse, Button } from "react-bootstrap";
import CategorySelector from "./CategorySelector";
import TrendingHashtags from "./TrendingHashtags";

export default function FiltersBar({
  selectedCategorySlug,
  onCategoryChange,
  showHidden,
  onShowHiddenChange,
  date,
  onDateChange,
  trendingHashtags,
  hashtagsLoading,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        const savedState = localStorage.getItem("filtersBarCollapsed");
        setIsCollapsed(savedState !== null ? savedState === "true" : true);
      } else {
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (isMobile) {
      localStorage.setItem("filtersBarCollapsed", newState.toString());
    }
  };

  const filterContent = (
    <>
      <CategorySelector
        selectedSlug={selectedCategorySlug}
        onSelectCategory={onCategoryChange}
      />
      <FormCheck
        type="checkbox"
        id="show-hidden"
        label="Show Hidden"
        checked={showHidden}
        onChange={(e) => onShowHiddenChange(e.target.checked)}
        className="mb-2 text-body-emphasis mt-2"
      />
      <Form.Group className="mb-2">
        <Form.Label className="text-body-secondary small">
          Show messages for
        </Form.Label>
        <Form.Control
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </Form.Group>
      <TrendingHashtags hashtags={trendingHashtags} loading={hashtagsLoading} />
    </>
  );

  if (isMobile) {
    return (
      <>
        <style jsx>{`
          .filters-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            background: var(--bs-tertiary-bg);
            border: 1px solid var(--bs-border-color);
          }

          .filters-header:hover {
            background: var(--bs-secondary-bg);
          }

          .filters-header-title {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--bs-secondary);
          }

          .collapse-icon {
            transition: transform 0.3s ease;
            color: var(--bs-secondary);
          }

          .collapse-icon.collapsed {
            transform: rotate(-90deg);
          }

          .filters-content {
            padding: 0.5rem 0;
          }
        `}</style>
        <div>
          <div className="filters-header" onClick={toggleCollapse}>
            <span className="filters-header-title">Filters</span>
            <span
              className={`collapse-icon ${isCollapsed ? "collapsed" : ""}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </div>
          <Collapse in={!isCollapsed}>
            <div className="filters-content">{filterContent}</div>
          </Collapse>
        </div>
      </>
    );
  }

  return <div className="filters-content">{filterContent}</div>;
}
