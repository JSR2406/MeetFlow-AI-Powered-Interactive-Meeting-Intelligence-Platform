import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingSearchFilter } from "@/components/meetings/meeting-search-filter";
import { Suspense } from "react";

function renderFilter() {
  return render(
    <Suspense fallback={null}>
      <MeetingSearchFilter />
    </Suspense>
  );
}

describe("MeetingSearchFilter", () => {
  it("renders search input and all status filters", () => {
    renderFilter();
    expect(screen.getByPlaceholderText(/search meetings/i)).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("shows clear (X) button when search input has text", async () => {
    const user = userEvent.setup();
    renderFilter();

    const input = screen.getByPlaceholderText(/search meetings/i);
    await user.type(input, "Planning");

    // Use getAllByRole to avoid "multiple elements" error — the X button is one of many buttons
    const buttons = screen.getAllByRole("button");
    // The clear button has an SVG X icon (lucide-x class) and appears after typing
    const clearBtn = buttons.find((b) =>
      b.querySelector(".lucide-x") !== null
    );
    expect(clearBtn).toBeDefined();
    expect(clearBtn).toBeInTheDocument();
  });

  it("clears input value when X button is clicked", async () => {
    const user = userEvent.setup();
    renderFilter();

    const input = screen.getByPlaceholderText(/search meetings/i) as HTMLInputElement;
    await user.type(input, "Q3 Planning");
    expect(input.value).toBe("Q3 Planning");

    const buttons = screen.getAllByRole("button");
    const clearBtn = buttons.find((b) => b.querySelector(".lucide-x") !== null);
    if (clearBtn) await user.click(clearBtn);

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("status filter buttons all render as clickable elements", () => {
    renderFilter();
    // All 5 status buttons (All, Scheduled, Live, Completed, Cancelled) should be present
    const filterButtons = ["All", "Scheduled", "Live", "Completed", "Cancelled"];
    filterButtons.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("'All' filter starts with active styling (bg-brand)", () => {
    renderFilter();
    const allBtn = screen.getByText("All");
    // The default active filter is 'all' which gets bg-brand class
    expect(allBtn.className).toContain("bg-brand");
  });

  it("inactive status filters do not have bg-brand class", () => {
    renderFilter();
    const scheduledBtn = screen.getByText("Scheduled");
    // Non-active filters should NOT have bg-brand
    expect(scheduledBtn.className).not.toContain("bg-brand");
  });
});
