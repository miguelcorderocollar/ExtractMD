
# Chrome Extension for YouTube Transcript Extraction

Develop a Chrome extension from scratch to automate transcript extraction from YouTube videos. The extension should trigger via a persistent floating button (not the extension toolbar icon) and include customizable settings.

## Functionality

- **Trigger Mechanism**:
  - Display a persistent floating button on the bottom-right of the page when on a YouTube video page (`youtube.com/watch?v=*`).
  - Use the provided `icon128.png` from the `/icons` directory, styled like a chatbot bubble.
  - On click, the button switches to a loading SVG animation.
  - After transcript extraction, display a green checkmark in the button for 5 seconds, then revert to the original icon.
  - If not on a YouTube video page, do not show the button and, if triggered (e.g., via keybinding), show a notification: "This extension only works on YouTube video pages."

- **Keybinding (Optional)**:
  - Allow triggering the extension via a customizable keyboard shortcut (if feasible within Chrome extension permissions).

- **Transcript Extraction Process**:
  1. **Check Context**:
     - Verify the page is a YouTube video (`youtube.com/watch?v=*`). If not, display the error notification above.
  2. **Open Description**:
     - Click the "Show more" button in the video description:
       ```html
       <tp-yt-paper-button id="expand" class="button style-scope ytd-text-inline-expander" style-target="host" role="button" tabindex="0" animated="" elevation="0" aria-disabled="false" style="left: 227px;">
         <!--css-build:shady-->
         ...more
       </tp-yt-paper-button>
       ```
     - Wait 500ms after clicking.
  3. **Open Transcript**:
     - Check if the "Show transcript" button exists and click it:
       ```html
       <div id="button-container" class="style-scope ytd-video-description-transcript-section-renderer">
         <div id="primary-button" class="style-scope ytd-video-description-transcript-section-renderer">
           <ytd-button-renderer class="style-scope ytd-video-description-transcript-section-renderer" button-renderer="" button-next="">
             <yt-button-shape>
               <button class="yt-spec-button-shape-next yt-spec-button-shape-next--outline yt-spec-button-shape-next--call-to-action yt-spec-button-shape-next--size-m yt-spec-button-shape-next--enable-backdrop-filter-experiment" aria-label="Show transcript">
                 <div class="yt-spec-button-shape-next__button-text-content">
                   <span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">Show transcript</span>
                 </div>
               </button>
             </yt-button-shape>
           </ytd-button-renderer>
         </div>
       </div>
       ```
  4. **Wait for Transcript Load**:
     - Wait until the transcript is fully loaded, preferably by monitoring the network request `https://www.youtube.com/youtubei/v1/get_transcript?` for completion.
     - Alternatively, check for the presence of transcript data in the DOM:
       ```html
       <ytd-transcript-segment-list-renderer class="style-scope ytd-transcript-search-panel-renderer">
         <div id="segments-container" class="style-scope ytd-transcript-segment-list-renderer">
           <ytd-transcript-segment-renderer class="style-scope ytd-transcript-segment-list-renderer" rounded-container="">
             <div class="segment style-scope ytd-transcript-segment-renderer" role="button" tabindex="0" aria-label="0 seconds [Music]">
               <div class="segment-timestamp style-scope ytd-transcript-segment-renderer">0:00</div>
               <yt-formatted-string class="segment-text style-scope ytd-transcript-segment-renderer">[Music]</yt-formatted-string>
             </div>
           </ytd-transcript-segment-renderer>
           <!-- Additional segments -->
         </div>
       </ytd-transcript-segment-list-renderer>
       ```
     - If the video has chapters, the transcript includes section headers:
       ```html
       <ytd-transcript-segment-list-renderer class="style-scope ytd-transcript-search-panel-renderer">
         <div id="segments-container" class="style-scope ytd-transcript-segment-list-renderer">
           <ytd-transcript-section-header-renderer class="style-scope ytd-transcript-segment-list-renderer">
             <div id="header" class="transcript-section-header style-scope ytd-transcript-section-header-renderer" tabindex="0" role="button" aria-label="Intro">
               <yt-section-header-view-model class="ytSectionHeaderViewModelHost">
                 <h2 class="shelf-header-layout-wiz__title"><span class="yt-core-attributed-string">Intro</span></h2>
               </yt-section-header-view-model>
             </div>
           </ytd-transcript-section-header-renderer>
           <ytd-transcript-segment-renderer class="style-scope ytd-transcript-segment-list-renderer">
             <div class="segment style-scope ytd-transcript-segment-renderer" role="button" tabindex="0" aria-label="0 seconds it's almost the first question...">
               <div class="segment-timestamp style-scope ytd-transcript-segment-renderer">0:00</div>
               <yt-formatted-string class="segment-text style-scope ytd-transcript-segment-renderer">it's almost the first question...</yt-formatted-string>
             </div>
           </ytd-transcript-segment-renderer>
           <!-- Additional segments -->
         </div>
       </ytd-transcript-segment-list-renderer>
       ```
     - Prefer network response parsing for cleaner data, where transcript segments are structured as:
       ```json
       {
         "transcriptSegmentRenderer": {
           "startMs": "2116640",
           "endMs": "2122960",
           "snippet": {
             "runs": [
               {
                 "text": "probably worthwhile right so I wouldn't want to go against them..."
               }
             ]
           },
           "startTimeText": {
             "simpleText": "35:16"
           },
           "accessibility": {
             "accessibilityData": {
               "label": "35 minutes, 16 seconds probably worthwhile right..."
             }
           },
           "targetId": "xFQ5mIJdxhA.CgNhc3ISAmVuGgA%3D.2116640.2122960"
         }
       }
       ```
     - Chapter headers in the network response look like:
       ```json
       {
         "transcriptSectionHeaderRenderer": {
           "startMs": "898000",
           "endMs": "969000",
           "accessibility": {
             "accessibilityData": {
               "label": "Don’t just do things for the sake of marketing"
             }
           },
           "sectionHeader": {
             "sectionHeaderViewModel": {
               "headline": {
                 "content": "Don’t just do things for the sake of marketing"
               }
             }
           }
         }
       }
       ```
  5. **Copy to Clipboard**:
     - Copy the full transcript to the clipboard.
     - Include settings to toggle whether timestamps are included in the output.
     - Show a visual notification (e.g., green checkmark in the floating button) to confirm successful copying.

## Settings

- Provide a settings panel to:
  - Toggle inclusion of timestamps in the copied transcript.
  - (Optional) Configure the keybinding for triggering the extension.

## Notes

- Ensure the extension handles cases where transcripts are unavailable (e.g., no "Show transcript" button or empty transcript).
- Prefer network response parsing (`https://www.youtube.com/youtubei/v1/get_transcript?`) over DOM scraping for reliability and cleaner data.
- Ensure the floating button is unobtrusive, visually consistent with YouTube’s UI, and responsive to page changes (e.g., navigation away from a video).