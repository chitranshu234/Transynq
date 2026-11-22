INSERT INTO assets (code, name, location, scenario, status)
SELECT 'TR-101', 'Main Power Transformer', 'Substation A', 'NORMAL', 'HEALTHY'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE code = 'TR-101');
