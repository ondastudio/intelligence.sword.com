import { useCallback } from "react";
import styled from "styled-components";
import { Box, Card, Flex, Text } from "@sanity/ui";
import { ChevronDownIcon } from "@sanity/icons";
import { FieldPresence, type ObjectFieldProps } from "sanity";

/**
 * SectionField — a custom `field` component for the top-level page sections.
 *
 * Sanity's default object field renders a small grey label with no visual weight,
 * so a page of ~11 stacked sections is hard to scan. This replaces only the
 * *chrome*: a prominent, clickable header (brand accent + bold title + a rotating
 * chevron) sitting above the section's native fields (`props.children`). The form
 * inside is untouched — we let Sanity render it.
 *
 * Applied via `components: { field: SectionField }` on the `section()` helper in
 * the page schemas. Kept generic (no page-specific strings) so it drops onto any
 * section object across documents.
 */

const brand = "#7700ee";

const HeaderButton = styled.button`
  appearance: none;
  border: 0;
  width: 100%;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  display: block;
`;

// Chevron that rotates to point right when the section is collapsed.
const Chevron = styled(ChevronDownIcon)<{ $collapsed: boolean }>`
  transition: transform 150ms ease;
  transform: rotate(${(p) => (p.$collapsed ? "-90deg" : "0deg")});
  font-size: 1.35rem;
`;

// Small dot flagging that a collapsed section hides a validation error.
const ErrorDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--card-badge-critical-dot-color, #f03e2f);
  flex: none;
`;

export function SectionField(props: ObjectFieldProps) {
  const { title, description, collapsed, collapsible, presence, validation } = props;

  const toggle = useCallback(() => {
    if (collapsed) props.onExpand();
    else props.onCollapse();
  }, [collapsed, props]);

  // If Sanity disabled collapse for this context, degrade to the default field.
  if (!collapsible) return props.renderDefault(props);

  const hasError = validation.some((v) => v.level === "error");

  return (
    <Card radius={2} shadow={1} tone="default" style={{ borderLeft: `3px solid ${brand}` }}>
      <HeaderButton type="button" onClick={toggle} aria-expanded={!collapsed}>
        <Flex align="center" gap={3} padding={3}>
          <Box style={{ color: brand }}>
            <Chevron $collapsed={!!collapsed} />
          </Box>
          <Box flex={1}>
            <Text size={2} weight="semibold">
              {title || "Section"}
            </Text>
            {description && (
              <Box marginTop={2}>
                <Text size={1} muted>
                  {description}
                </Text>
              </Box>
            )}
          </Box>
          {hasError && <ErrorDot title="This section has validation errors" />}
          {presence.length > 0 && <FieldPresence presence={presence} maxAvatars={3} />}
        </Flex>
      </HeaderButton>

      {!collapsed && (
        <Box padding={3} paddingTop={0}>
          {props.children}
        </Box>
      )}
    </Card>
  );
}
