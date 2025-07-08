# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a GitHub Pages website for the book "Mere Metaphor" that lives at meremetaphor.com. The site automatically converts the book's PDF content into HTML for web display.

## Project Structure

- `meremetaphor.pdf` - The source PDF of the book (exported from Apple Pages)
- `index.html` - The main website page that displays the book content
- `scripts/build.js` - Node.js script that parses the PDF and generates HTML
- `.nojekyll` - Disables Jekyll processing on GitHub Pages
- `package.json` - Node.js project configuration

## Development Commands

- `npm install` - Install dependencies (currently just pdf-parse)
- `npm run build` - Parse the PDF and update index.html with the book content
- `npm run dev` - Build the site and start a local server at http://localhost:8080

## Architecture

The build process is intentionally minimal:
1. `pdf-parse` library extracts text from the PDF
2. Basic heuristics convert text to HTML (short lines become headings, longer text becomes paragraphs)
3. The HTML is injected directly into index.html

## Development Philosophy

- Minimal dependencies (only pdf-parse for PDF extraction)
- No static site generators or complex build tools
- Direct PDF to HTML conversion
- Clean, simple HTML output focused on readability

## Future Improvements to Consider

- Better chapter/section detection from PDF structure
- Image extraction from PDF
- Typography and styling improvements
- Automatic build on PDF update