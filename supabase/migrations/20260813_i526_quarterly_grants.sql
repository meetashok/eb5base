GRANT SELECT, INSERT, UPDATE, DELETE ON public.i526_releases TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i526_filing_cells TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.i526_processing_summary TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.i526_releases_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.i526_filing_cells_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.i526_processing_summary_id_seq TO service_role;
