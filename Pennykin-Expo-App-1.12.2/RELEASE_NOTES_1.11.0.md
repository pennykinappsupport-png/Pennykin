# Pennykin 1.11.0 — Dog Sleep Proportions

- Increased sleeping dog body height by approximately 26%, matching the sleeping cat's visible height-to-width ratio (0.577).
- Aligned the dog's sleeping paws to the cat's floor baseline. The source dog pose previously sat 159 pixels higher in its 600x640 bitmap.
- Applied the same pose correction to both Rest_Enter/Rest_Loop/Rest_Exit rendering and ordinary sleeping rendering.
- Kept the dog's width and the existing pet identity artwork. Cat and rabbit sleep art remain unchanged.
- Includes the previous dog/rabbit Play choreography and the removal of tap bouncing in both pet selectors.
- Version is synchronized across app.json, package.json, package-lock.json, src/brand.ts, and README.md. iOS build 48; Android versionCode 48.

Validation: TypeScript check passed. Native device/simulator visual inspection remains to be completed.
