# Changelog - Filtered Report Comparison Feature

## Version 1.1.0 - Bug Fixes and UX Improvements (2026-02-17)

### Bug Fixes
1. **Filter Dropdown Population** - Fixed issue where dimension dropdowns (Gender, Race, etc.) were empty after checking dimension boxes
   - Added `populateFilterValues()` call after Excel file parsing
   - All 7 dimension dropdowns now pre-populate with data immediately on file upload

2. **Page Refresh State** - Fixed filter UI state not persisting after page refresh
   - "Enable Filtered Report Comparison" checkbox state now checked on page load
   - Dimension toggle checkboxes state restored on page load
   - Filter controls section visibility synced with checkbox state

3. **Bar Chart Legend** - Added missing legend marker for filtered subset
   - Orange legend item now appears when filtered data is displayed
   - Added `.chart-legend-color.orange` CSS class

4. **Satisfaction Chart Display** - Updated stacked bar chart to show filtered data instead of overall
   - When filter is active, chart shows filtered current year vs filtered previous year
   - Added orange indicator: "📊 Chart shows filtered subset data"
   - Overall data still visible in table below

5. **Pagination Math** - Fixed table row limits to account for filtered subset row
   - Satisfaction tables: Account for 2 fixed rows (Overall + Filtered) when calculating breakdown rows
   - Heatmap Department tables: Updated maxRowsPerSlide calculation to include filtered row
   - Prevents content overflow on slides

### UX Improvements
1. **Consistent Row Styling** - Applied same visual style to filtered subset rows as overall rows
   - HeatMap: Filtered row now has orange highlight matching overall row's blue highlight
   - First two cells (name + sample size) have white text on orange background
   - Added `.filtered-subset-row` class for consistent styling

2. **Filtered Row on All Pages** - Extended filtered subset row display to continuation pages
   - Satisfaction - Department (Continued) now shows filtered row
   - All satisfaction slides now consistently display filtered data

3. **Multi-Select Hint** - Added helpful tip to filter UI
   - "💡 Hold Ctrl (Windows) or Cmd (Mac) to select multiple values within each dimension"

## Version 1.0.0 - Initial Release (2026-02-17)

### Features
- Multi-dimensional demographics filtering (7 dimensions)
- Filtered data comparison in all major slides
- Real-time response count feedback
- Extensible architecture for Phase 2/3 enhancements

---

## Known Issues & Future Work

### To Investigate
- Risk Matrix slides: Do not currently show filtered subset rows
- eNPS slides: Do not currently show filtered subset rows
- Consider adding filtered rows to these slides if needed

### Planned Enhancements (Phase 2)
- Question response filters (flight risk, satisfaction, eNPS categories)
- Custom score range filters
- Engagement level category filters

### Planned Enhancements (Phase 3)
- OR logic support
- Saved filter presets
- Multiple filter comparison (compare two filtered groups)

---

## Files Modified (v1.1.0)

- `js/upload.js` - Filter initialization and state management
- `js/slides/SatisfactionSlide.js` - Chart display logic and pagination
- `js/slides/BarChartSlide.js` - Legend generation
- `js/slides/HeatMapSlide.js` - Filtered row styling
- `js/slideGenerator.js` - Pagination calculations for Satisfaction and HeatMap
- `css/slides-charts.css` - Orange legend color
- `css/slides-tables.css` - Filtered subset row styling

---

## Testing Checklist

- [x] Filter dropdowns populate after file upload
- [x] Page refresh preserves checkbox states
- [x] Bar chart shows orange legend for filtered data
- [x] Satisfaction chart displays filtered data when filter active
- [x] Filtered subset row appears on all Satisfaction slides
- [x] Filtered subset row has consistent styling (orange highlight)
- [x] HeatMap filtered row has matching overall row style
- [x] Department pagination accounts for filtered row
- [x] No content overflow on any slides

---

## Migration Notes

No breaking changes. All changes are backward compatible with reports generated without filters.
