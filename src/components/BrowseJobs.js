import React from "react";

const JOB_SITES = [
  {
    name: "LinkedIn Jobs",
    description: "Professional network and job search",
    url: "https://www.linkedin.com/jobs/",
    color: "bg-[#0A66C2] hover:bg-[#004182]",
  },
  {
    name: "Indeed",
    description: "Large general job board",
    url: "https://www.indeed.com/",
    color: "bg-[#2557A7] hover:bg-[#1b3f7a]",
  },
  {
    name: "Glassdoor",
    description: "Jobs plus company reviews and salaries",
    url: "https://www.glassdoor.com/Job/",
    color: "bg-[#0CAA41] hover:bg-[#088a34]",
  },
  {
    name: "Xing",
    description: "DACH professional network and jobs",
    url: "https://www.xing.com/jobs",
    color: "bg-[#006567] hover:bg-[#00494b]",
  },
  {
    name: "StepStone",
    description: "Major European and German job board",
    url: "https://www.stepstone.de/",
    color: "bg-[#FF6D00] hover:bg-[#e05f00]",
  },
  {
    name: "Welcome to the Jungle",
    description: "EU tech and startup roles",
    url: "https://www.welcometothejungle.com/",
    color: "bg-[#FF5C4D] hover:bg-[#e0493c]",
  },
  {
    name: "Wellfound",
    description: "Startup jobs (formerly AngelList)",
    url: "https://wellfound.com/jobs",
    color: "bg-[#140D26] hover:bg-[#2a1f45]",
  },
  {
    name: "We Work Remotely",
    description: "Remote-only job listings",
    url: "https://weworkremotely.com/",
    color: "bg-[#1AD63D] hover:bg-[#14b332] text-gray-900",
  },
  {
    name: "Monster",
    description: "International job board",
    url: "https://www.monster.com/",
    color: "bg-[#6E46AE] hover:bg-[#58368c]",
  },
  {
    name: "Google Jobs",
    description: "Aggregated listings from many boards",
    url: "https://www.google.com/search?q=jobs&ibp=htl;jobs",
    color: "bg-[#4285F4] hover:bg-[#3367d6]",
  },
];

function BrowseJobs() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse jobs on
          </h1>
          <p className="text-gray-600">
            Choose a job site. It will open in a new tab outside Jobna.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JOB_SITES.map((site) => (
            <a
              key={site.name}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${site.color} text-white rounded-xl p-6 shadow-lg transition-transform hover:scale-[1.02]`}
            >
              <h2 className="text-xl font-semibold">{site.name}</h2>
              <p className="text-sm mt-2 opacity-90">{site.description}</p>
              <p className="text-sm mt-4 font-medium underline underline-offset-2">
                Open website
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BrowseJobs;
