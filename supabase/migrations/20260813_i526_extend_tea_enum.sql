ALTER TABLE public.i526_filing_cells
  DROP CONSTRAINT IF EXISTS i526_filing_cells_tea_category_check;

ALTER TABLE public.i526_filing_cells
  ADD CONSTRAINT i526_filing_cells_tea_category_check CHECK (tea_category IN (
    'RURAL','HIGH_UNEMPLOYMENT','RURAL_AND_HIGH_UNEMPLOYMENT','INFRASTRUCTURE',
    'UNRESERVED','DIRECT','UNKNOWN_TEA','PRE_RIA_UNKNOWN','OTHER'
  ));
