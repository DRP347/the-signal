# The Signal editorial system

The masthead is a compact independent-newspaper identity. The homepage starts with an actual collected story; there is no marketing hero. CSS custom properties define paper, ink, forest, accent colors, rules, reading widths and spacing in app/globals.css. The layout uses 12 desktop, 8 tablet and 4 mobile columns with a 1440px maximum inner width.

Newsreader variable roman and italic supply editorial headlines and long reading. IBM Plex Sans supplies navigation, decks and metadata. IBM Plex Mono is reserved for identifiers and technical data. Headlines balance naturally without line clamps. Large/long headlines scale at breakpoints; body copy remains 19px on desktop and 18px on smaller reading columns.

Modules live in components/newspaper.tsx: lead, secondary, compact briefing, deep read, culture feature and source credit. Source-based intelligence remains structured in the homepage and existing route components. An edition selector reserves specialist content before allocating general stories, uses each story once, and handles sparse/empty data without invented fill.

The homepage sequence alternates asymmetric front page, numbered briefing, feature, quiet service context, structured security, a lavender community section, developer columns and personal controls. At small widths the masthead condenses and the keyboard-accessible section menu replaces crowded navigation.

Article pages distinguish collected source metadata from optional AI output. Original reporting is linked prominently; no full external articles or invented explanatory paragraphs are added. Advisory, incident, provenance and ranking data remain available. Related reading excludes the current story.

Light and dark modes share semantic variables. Focus rings, 44px controls, reduced-motion overrides and meaningful empty/error states are part of the system. External-image approval and illustration policy are documented in VISUALS.md.
