# Filtered Report Comparison - User Guide

## Overview
The Filtered Report Comparison feature allows you to create reports that compare a specific subset of survey responses against the overall results. This is useful for analyzing particular demographic groups, locations, or combinations of employee characteristics.

---

## How to Use

### Step 1: Upload Your Excel File
1. Enter your survey name and report name
2. Upload your Excel file (.xlsx or .xls)
3. Wait for the file to be processed

### Step 2: Enable Filtering
Once your file is uploaded, you'll see a new section appear:
- ☑ **Enable Filtered Report Comparison**

Check this box to reveal the filter options.

### Step 3: Select Filter Dimensions
You'll see 7 demographic dimensions available:

- **Location** - Filter by office location (e.g., Cape Town, Johannesburg, Uganda)
- **Department** - Filter by department (e.g., Sales, IT, HR)
- **Cost Center** - Filter by cost center
- **Gender** - Filter by gender (e.g., Male, Female)
- **Race** - Filter by race/ethnicity (e.g., African, White, Coloured, Indian)
- **Age** - Filter by age group
- **Tenure (LoS)** - Filter by length of service (e.g., 0-1 years, 1-5 years, 5-10 years)

For each dimension you want to filter by:
1. ☑ **Check the dimension checkbox** to enable it
2. **Select one or more values** from the dropdown
   - Hold **Ctrl** (Windows) or **Cmd** (Mac) to select multiple values
   - Example: Select both "Cape Town" and "Johannesburg" for Location

### Step 4: Review Filter Count
As you select filters, you'll see a blue feedback box showing:
> 💡 **127 responses match all selected filters**

This tells you how many survey responses match ALL your selected criteria.

### Step 5: Generate Report
Click **Generate Report** to create your comparison report.

---

## Example Use Cases

### Example 1: Single Dimension Filter
**Goal**: Compare employees in Cape Town vs overall company

**Filters**:
- ☑ Location: Cape Town

**Result**: Report shows overall company results alongside Cape Town-specific results

---

### Example 2: Two Dimension Filter
**Goal**: Compare African Males vs overall company

**Filters**:
- ☑ Race: African
- ☑ Gender: Male

**Result**: Report shows results for African Male employees compared to overall

---

### Example 3: Four Dimension Filter
**Goal**: Compare new African Male employees in Uganda vs overall

**Filters**:
- ☑ Race: African
- ☑ Gender: Male
- ☑ Location: Uganda
- ☑ Tenure: 0-1 years, 1-5 years

**Result**: Report shows results for African Males in Uganda with 0-5 years tenure

---

## How Filters Work (AND Logic)

All selected filters use **AND logic**, meaning a response must match **ALL** criteria:

**Example**: If you select:
- Gender: Male
- Location: Cape Town, Johannesburg
- Tenure: 1-5 years

Then an employee must be:
- Male **AND**
- In Cape Town **OR** Johannesburg (within the Location dimension) **AND**
- Have 1-5 years tenure

---

## Understanding the Report

### Methodology Slide
Shows your filter criteria and the number of responses:
> **Filtered Report:** 127 responses matching Race: African | Gender: Male | Location: Uganda

### Satisfaction Slides
The "FILTERED REPORT" row appears immediately after "SEACOM ENGAGEMENT INDEX":

| Dimension | 2025 % Dissatisfied | 2025 % Satisfied |
|-----------|---------------------|------------------|
| SEACOM ENGAGEMENT INDEX | 15% | 85% |
| **FILTERED REPORT** | **20%** | **80%** |
| Cape Town | 12% | 88% |

*(Filtered row has light orange background)*

### Bar Chart Slides
Filtered data appears as **orange bars** alongside overall (blue) and previous year (light blue):

```
        Overall (Blue) ████████ 75%
  Previous Year (Light Blue) ███████ 70%
Filtered Report (Orange) ██████ 65%
```

### Heatmap Slides
The "FILTERED REPORT" row appears after overall with light orange background:

```
SEACOM ENGAGEMENT INDEX  n=444  75%  80%  72%  ...
FILTERED REPORT          n=127  70%  78%  68%  ...
Cape Town                n=150  72%  82%  70%  ...
```

---

## Tips & Best Practices

### ✅ Do's
- **Start broad, then narrow**: Try single dimensions first, then add more
- **Check the count**: Ensure you have enough responses (n > 10 is ideal)
- **Combine meaningfully**: Combine dimensions that make business sense
- **Use for targeted analysis**: Great for investigating specific groups or locations

### ❌ Don'ts
- **Avoid too many filters**: Very specific filters may result in too few responses (n < 5)
- **Don't expect exact matches**: If no responses match, the report will show empty filtered data
- **Don't filter by everything**: More filters ≠ better insights

---

## Troubleshooting

### "0 responses match all selected filters"
**Cause**: Your filter combination is too specific - no employees match ALL criteria

**Solutions**:
- Remove some filters
- Select broader values (e.g., select multiple locations instead of one)
- Check if the combination makes sense (e.g., don't filter by "Uganda" if all Uganda employees are in one department)

### "Please select at least one filter dimension and values"
**Cause**: You enabled filtering but didn't select any filters

**Solution**: Either:
- Uncheck "Enable Filtered Report Comparison" to generate a normal report
- Select at least one dimension and value to filter by

### Filtered row shows insufficient sample warnings
**Cause**: The filtered group has ≤3 responses for a particular breakdown

**Solution**: This is expected for very specific filters. Consider:
- Using broader filters
- Focusing on overall filtered results rather than sub-breakdowns
- Adding this to methodology as a limitation

---

## Sample Size Guidelines

| Sample Size | Recommendation |
|-------------|----------------|
| n ≥ 30 | ✅ Excellent - statistically robust |
| n = 10-29 | ⚠️ Good - use with caution, note sample size |
| n = 5-9 | ⚠️ Fair - interpret carefully, significant limitations |
| n ≤ 4 | ❌ Poor - data masked for confidentiality |

---

## Future Enhancements

### Coming Soon (Phase 2)
- **Question Response Filters**: Filter by how employees answered specific questions
  - Example: "Employees who answered 'yes' to both flight risk questions"
  - Example: "Dissatisfied employees"
  - Example: "eNPS Detractors"

### Planned (Phase 3)
- **Saved Filter Presets**: Save common filter combinations
  - "High Flight Risk"
  - "Top Performers"
  - "New Joiners"
- **Multiple Filter Comparison**: Compare two filtered groups side-by-side
  - Example: "Cape Town Males" vs "Johannesburg Males"

See `FILTER_PHASES.md` for detailed roadmap.

---

## Need Help?

If you encounter issues or have questions:
1. Check this guide first
2. Review `FILTER_PHASES.md` for technical details
3. Contact the development team

---

**Version**: 1.0.0 (Phase 1 - Multi-Dimensional Demographics Filtering)  
**Last Updated**: February 17, 2026
