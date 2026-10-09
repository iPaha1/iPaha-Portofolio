"use client";

// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-client.tsx
// Client shell — owns all tab state and sidebar state.
// Receives userId as a plain prop from the server page above.

import { useState } from "react";
import { YoutubeTab } from "./types";
import YoutubeStudioOverview from "./youtube-studio-overview";
import YoutubeWeeklyGenerator from "./youtube-video-generation";
import YoutubeVideoLibrary from "./youtube-studio-video-library";
import YoutubeIdeasBank from "./youtube-idea-bank-full";
import YoutubeChannelSettings from "./youtube-channel-settings";
import YoutubeAnalyticsDashboard from "./youtube-studio-analytics-dashboard";
import YoutubeContentCalendar from "./youtube-studio-content-calendar";
import YoutubeStudioNav from "./youtube-studio-nav";


interface Props {
  userId: string; // already unwrapped by the server page above
}

export default function YoutubeStudioClient({ userId }: Props) {
  const [activeTab,   setActiveTab]   = useState<YoutubeTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderTab = () => {
    const p = { userId };
    switch (activeTab) {
      case "overview":   return <YoutubeStudioOverview     {...p} onNavigate={setActiveTab} />;
      case "generator":  return <YoutubeWeeklyGenerator    {...p} />;
      case "library":    return <YoutubeVideoLibrary       {...p} />;
      case "ideas":      return <YoutubeIdeasBank          {...p} />;
      case "calendar":   return <YoutubeContentCalendar    {...p} />;
      case "analytics":  return <YoutubeAnalyticsDashboard {...p} />;
      case "settings":   return <YoutubeChannelSettings    {...p} />;
    }
  };

    return (
    // No fixed positioning, no extra wrappers — just a normal block inside
    // whatever the admin layout renders as its main content area.
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <YoutubeStudioNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="p-6">
        {renderTab()}
      </main>
    </div>
  );
}







// "use client";

// // app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-client.tsx
// // Client shell — owns all tab state and sidebar state.
// // Receives userId as a plain prop from the server page above.

// import { useState } from "react";
// import { YoutubeTab } from "./types";
// import YoutubeStudioOverview from "./youtube-studio-overview";
// import YoutubeWeeklyGenerator from "./youtube-video-generation";
// import YoutubeVideoLibrary from "./youtube-studio-video-library";
// import YoutubeIdeasBank from "./youtube-idea-bank-full";
// // import { YoutubeAnalyticsDashboard, YoutubeContentCalendar } from "./youtube-studio-ideasbank-calenderanalytics-settings";
// import YoutubeChannelSettings from "./youtube-channel-settings";
// import YoutubeStudioLayout from "./youtube-studio-layout";
// import YoutubeStudioSidebar from "./youtube-studio-sidebar";
// import YoutubeStudioHeader from "./youtube-studio-header";
// import YoutubeAnalyticsDashboard from "./youtube-studio-analytics-dashboard";
// import YoutubeContentCalendar from "./youtube-studio-content-calendar";
// import YoutubeStudioNav from "./youtube-studio-nav";
// // import { YoutubeIdeasBank } from "./youtube-studio-ideasbank-calenderanalytics-settings";
// // import YoutubeStudioOverview from "./youtube-weekly-overview";




// interface Props {
//   userId: string; // already unwrapped by the server page above
// }

// export default function YoutubeStudioClient({ userId }: Props) {
//   const [activeTab,   setActiveTab]   = useState<YoutubeTab>("overview");
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const renderTab = () => {
//     const p = { userId };
//     switch (activeTab) {
//       case "overview":   return <YoutubeStudioOverview     {...p} onNavigate={setActiveTab} />;
//       case "generator":  return <YoutubeWeeklyGenerator    {...p} />;
//       case "library":    return <YoutubeVideoLibrary       {...p} />;
//       case "ideas":      return <YoutubeIdeasBank          {...p} />;
//       case "calendar":   return <YoutubeContentCalendar    {...p} />;
//       case "analytics":  return <YoutubeAnalyticsDashboard {...p} />;
//       case "settings":   return <YoutubeChannelSettings    {...p} />;
//     }
//   };

//     return (
//     // No fixed positioning, no extra wrappers — just a normal block inside
//     // whatever the admin layout renders as its main content area.
//     <div className="min-h-screen bg-[#0a0a0f] text-white">
//       <YoutubeStudioNav
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//       />
//       <main className="p-6">
//         {renderTab()}
//       </main>
//     </div>
//   );
// }




