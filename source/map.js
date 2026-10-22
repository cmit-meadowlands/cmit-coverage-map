/* ==========================================================================
   MAP — the only thing you should need to edit.
   Copy, links, positions, flows and threat toasts all live here.
   Positions are in meters: office floor spans x -12..12, z -8..8, y is up.
   An `at` entry is [x, y, z] or [x, y, z, rotationYdegrees].
   `model` names come from the MODELS library in the scene code.
   ========================================================================== */
const MAP = {
  office: {
    name: "CMIT Solutions of the Meadowlands",
    phone: "201-777-4345",
    tel: "+12017774345",
    url: "https://cmitsolutions.com/clifton-nj-1237",
    urlLabel: "cmitsolutions.com/clifton-nj-1237",
    descriptor: "Managed IT, Cybersecurity & AI"
  },

  cta: { label: "Book a free IT Health Check", href: "https://calendly.com/osison-cmitsolutions/30min" },

  poster: {
    preheader: "Managed IT, Cybersecurity & AI",
    title: "Explore your technology team",
    body: "Click any device, room, or cloud service to see what we cover. Most owners find a few things they didn't know needed covering.",
    button: "Start exploring"
  },

  linkBase: "https://cmitsolutions.com/it-services/",
  links: {
    MS:    { path: "managed-services/",           label: "Managed IT services" },
    SEC:   { path: "cybersecurity/",              label: "Cybersecurity services" },
    MDR:   { path: "mdr-services/",               label: "Managed detection and response" },
    SUP:   { path: "it-support/",                 label: "IT support" },
    NET:   { path: "network-management/",         label: "Network management" },
    CLD:   { path: "cloud-services/",             label: "Cloud services" },
    BKP:   { path: "data-backup/",                label: "Data backup and recovery" },
    UC:    { path: "unified-communications/",     label: "Unified communications" },
    APP:   { path: "productivity-applications/",  label: "Productivity applications" },
    CMP:   { path: "compliance/",                 label: "Compliance services" },
    GUIDE: { path: "it-guidance/",                label: "vCISO and IT strategy" },
    PROC:  { path: "it-procurement/",             label: "IT procurement" },
    AI:    { path: "managed-ai-solutions/",       label: "Managed AI solutions" },
    PKG:   { path: "packages/",                   label: "Service packages" }
  },

  /* Who-handles-it chips. `unit` is the CMIT Team object the chip lights up. */
  handlers: {
    soc:    { label: "SOC",     unit: "soc" },
    remote: { label: "Remote",  unit: "remote" },
    onsite: { label: "On-site", unit: "truck" }
  },

  /* Compliance lens links (shown on regulated objects). */
  compliance: {
    title: "Compliance",
    links: ["CMP", "GUIDE"]
  },

  views: {
    overview:      { pos: [34, 30, 38], target: [4.5, 3.5, 1.5] },
    overviewPhone: { pos: [58, 58, 72], target: [6, 2.5, 1] }
  },

  render: {
    bloom: { strength: 0.55, radius: 0.35, threshold: 0.6 },
    idleSeconds: 20,
    autoRotateSpeed: 0.35
  },

  /* ---------------------------------------------------------------------- */
  zones: [
    /* ---------------- Zone 1 ---------------- */
    {
      id: "closet", group: "office", hotkey: "1",
      name: "Network & Server Closet",
      blurb: "The core of your network: internet, firewall, servers, and backups.",
      bounds: [-12, -8, -6, -1],
      objects: [
        { id: "ont", name: "ISP modem / fiber ONT", link: "NET", handlers: ["soc", "remote", "onsite"],
          tag: "Circuit monitoring, ISP escalation, failover",
          model: "device", size: [0.42, 0.32, 0.1], at: [[-11.92, 1.3, -3.6, 90]],
          summary: "This is where the internet enters your building, and when it goes down, everything stops. We watch your circuit around the clock and deal with the internet provider for you, so nobody on your team sits on hold. Where it makes sense, we add a backup connection that takes over automatically.",
          bullets: ["24/7 circuit monitoring with outage alerts", "We open and chase tickets with your ISP (internet service provider)", "Automatic failover to a second connection", "Speed and uptime checks against what you pay for"] },

        { id: "firewall", lead: 18, name: "Firewall", link: "SEC", handlers: ["soc", "remote", "onsite"],
          tag: "Next-gen firewall, threat filtering, patching",
          model: "device", size: [1.0, 0.18, 0.25], at: [[-10.6, 2.0, -6.25]],
          summary: "Your firewall decides what is allowed in and out of the office network. We run it as a next-generation firewall (NGFW) that inspects traffic for threats and blocks known-bad sites. Firmware patches happen on a schedule, not whenever someone remembers.",
          bullets: ["Next-generation firewall setup and rule management", "Threat, malware, and web filtering", "Firmware patching on a managed schedule", "Secure VPN (virtual private network) access for remote staff", "Logs reviewed 24/7 by the CMIT SOC"] },

        { id: "switch", lead: 18, name: "Core switch + patch panel", link: "NET", handlers: ["remote", "onsite"],
          tag: "VLANs, port security, cable documentation",
          model: "device", size: [1.0, 0.3, 0.22], at: [[-10.6, 1.6, -6.25]],
          summary: "Every wired device in the office plugs in here. We split the network into VLANs (virtual LANs, separate lanes for different kinds of traffic) and lock down unused ports. Every cable gets documented, so troubleshooting takes minutes instead of an afternoon.",
          bullets: ["VLAN design and network segmentation", "Port security and unused-port shutdown", "Labeled, documented cabling", "Firmware updates and health monitoring"] },

        { id: "rack", lead: 96, name: "Server rack", link: "MS", handlers: ["onsite", "remote"],
          tag: "Physical layout, cooling, labeling",
          model: "rack", size: [1.1, 2.4, 0.9], at: [[-10.6, 0, -6.85]],
          summary: "The rack is the physical home of your most important equipment. We plan the layout, keep airflow and cooling in check, and label everything. The result is a closet that is safe to work in and easy to hand off.",
          bullets: ["Rack layout and cable management", "Cooling and temperature monitoring", "Clear labeling and as-built documentation", "Physical access recommendations"] },

        { id: "server", name: "On-prem server", link: "MS", handlers: ["soc", "remote", "onsite"], regulated: true,
          tag: "24/7 monitoring, patching, lifecycle",
          model: "device", size: [1.0, 0.5, 0.3], at: [[-10.6, 0.95, -6.25]],
          summary: "If your business runs files, apps, or databases in the office, they live here. We monitor the server 24/7, patch it on a schedule, and plan its replacement before it becomes an emergency.",
          bullets: ["24/7 health and performance monitoring", "Scheduled operating system and application patching", "EDR (endpoint detection and response) protection", "Warranty and lifecycle tracking", "Migration planning when the cloud makes more sense"],
          compliance: "Servers that hold patient, client, or financial records fall under HIPAA (the Health Insurance Portability and Accountability Act), the FTC Safeguards Rule, or both. We put access controls, encryption, and audit logging in place and keep the documentation." },

        { id: "nas", lead: 96, name: "NAS / file storage", link: "BKP", handlers: ["remote", "soc", "onsite"], regulated: true,
          tag: "Permissions, encryption, capacity alerts",
          model: "device", size: [0.32, 0.42, 0.42], at: [[-6.95, 0.8, -7.15]],
          summary: "A NAS (network-attached storage) is the shared drive everyone saves to. We set who can see what, encrypt the data, and alert you long before it fills up.",
          bullets: ["Folder permissions by role", "Encryption at rest", "Capacity and drive-health alerts", "Included in backup and restore testing"],
          compliance: "Shared drives are where sensitive files quietly pile up. Role-based permissions and encryption support HIPAA and FTC Safeguards Rule requirements for protecting stored records." },

        { id: "backup", lead: 56, name: "Backup appliance", link: "BKP", handlers: ["remote", "soc", "onsite"], regulated: true,
          tag: "Local and offsite copies, tested restores",
          model: "device", size: [0.6, 0.22, 0.45], at: [[-7.9, 0.8, -7.15]],
          summary: "Backups only matter if they restore. This appliance keeps fast local copies of your servers and shared drives and sends a copy offsite. We test restores, so recovery is a plan, not a hope.",
          bullets: ["Local snapshots for fast recovery", "Automatic offsite replication", "Scheduled restore testing", "Ransomware-resistant retention", "Daily backup success monitoring"],
          compliance: "HIPAA expects a data backup and disaster recovery plan, and the FTC Safeguards Rule expects controls that are tested. Restore tests give you records you can show an auditor." },

        { id: "ups", lead: 18, name: "UPS / battery backup", link: "MS", handlers: ["remote", "onsite"],
          tag: "Runtime monitoring, graceful shutdown",
          model: "device", size: [0.55, 0.75, 0.6], at: [[-9.2, 0, -7.0]],
          summary: "A UPS (uninterruptible power supply) keeps the closet running through a flicker and shuts equipment down cleanly during a real outage. We monitor its battery so it is ready when you need it.",
          bullets: ["Runtime and battery health monitoring", "Automatic graceful shutdown during long outages", "Power event alerts", "Battery replacement scheduling"] }
      ]
    },

    /* ---------------- Zone 2 ---------------- */
    {
      id: "workspace", group: "office", hotkey: "2",
      name: "Workspace",
      blurb: "Every device your team touches each day, plus the team itself.",
      bounds: [-6, -8, 12, 0],
      objects: [
        { id: "workstations", labelIndex: 0, name: "Desktop workstations", link: "MS", handlers: ["soc", "remote", "onsite"],
          tag: "EDR, patching, remote support",
          model: "workstation", at: [[-3.6, 0, -6.2], [-0.4, 0, -6.2], [2.8, 0, -6.2], [-3.6, 0, -2.8], [2.8, 0, -2.8], [6.0, 0, -2.8]],
          summary: "Every desk computer gets the same protection and care, whether you have five or fifty. We run EDR (endpoint detection and response), keep Windows and your apps patched, and fix problems remotely, often before anyone notices.",
          bullets: ["EDR protection watched by the CMIT SOC", "Automated operating system and third-party patching", "Remote support in one click", "Hardware health and lifecycle tracking", "Standard setup for every new hire"] },

        { id: "laptops", labelIndex: 0, name: "Laptops (in office + remote)", link: "SEC", handlers: ["soc", "remote", "onsite"], regulated: true,
          tag: "Encryption, MFA, secure remote access",
          model: "laptop", at: [[6.0, 0, -6.2], [-0.4, 0, -2.8]],
          summary: "Laptops leave the building, so they carry more risk. We encrypt the drive, require MFA (multi-factor authentication), and give staff secure remote access. A lost bag becomes an inconvenience, not a breach.",
          bullets: ["Full-disk encryption", "MFA on every sign-in", "Secure remote access from anywhere", "EDR and patching on and off the network", "Remote lock and wipe"],
          compliance: "A lost, unencrypted laptop holding patient or customer data can be a reportable breach. Encryption and MFA are among the controls HIPAA and the FTC Safeguards Rule expect." },

        { id: "mobile", labelIndex: 2, name: "Mobile phones & tablets", link: "SEC", handlers: ["remote", "soc"],
          tag: "Mobile device management, remote wipe",
          items: [
            { model: "phone",  at: [[-3.05, 0, -6.0], [3.35, 0, -2.6]] },
            { model: "tablet", at: [[0.2, 0, -2.55, -10]] }
          ],
          summary: "Phones and tablets open email, files, and client apps all day. With MDM (mobile device management), we enforce passcodes and encryption, keep work data separate from personal, and can wipe a lost device remotely.",
          bullets: ["MDM enrollment for company and personal devices", "Passcode and encryption policies", "Work and personal data kept separate", "Remote lock and wipe"] },

        { id: "voip", labelIndex: 7, name: "VoIP desk phones", link: "UC", handlers: ["remote", "onsite"],
          tag: "Hosted phone system, call routing",
          model: "deskphone",
          at: [[-4.15, 0, -6.1], [-0.95, 0, -6.1], [2.25, 0, -6.1], [5.45, 0, -6.1], [-4.15, 0, -2.7], [-0.95, 0, -2.7], [2.25, 0, -2.7], [5.45, 0, -2.7], [7.4, 0.3, 3.05, 180]],
          summary: "Desk phones run over the internet now, which makes them part of your network. We provision them on a hosted phone system, set up call routing, and handle moves, adds, and changes.",
          bullets: ["Hosted VoIP (voice over internet protocol) provisioning", "Call routing, ring groups, and hunt lists", "Quality-of-service tuning so calls stay clear", "Moves, adds, and changes handled for you"] },

        { id: "printers", name: "Printers / multifunction copiers", link: "SUP", handlers: ["remote", "onsite"],
          tag: "Drivers, scan-to-email, firmware hardening",
          model: "mfp", at: [[10.4, 0, -7.1]],
          summary: "A modern copier is a full computer with a hard drive and network access. We manage drivers, set up scan-to-email and scan-to-folder, and harden the firmware so the copier is never the easy way in.",
          bullets: ["Driver deployment to every computer", "Scan-to-email and scan-to-folder setup", "Firmware updates and default password removal", "Secure print and stored-data settings"] },

        { id: "scanners", name: "Scanners & label printers", link: "SUP", handlers: ["remote", "onsite"],
          tag: "Setup, line-of-business app integration",
          items: [
            { model: "device", size: [0.42, 0.14, 0.3], at: [[10.15, 0.75, -4.6]] },
            { model: "device", size: [0.22, 0.2, 0.3], at: [[10.9, 0.75, -4.6]] }
          ],
          summary: "Specialty devices only matter when they work with your software. We set them up and connect them to your line-of-business apps, such as practice management, shipping, or inventory systems.",
          bullets: ["Device setup and driver management", "Integration with line-of-business apps", "Troubleshooting directly with the device vendor"] },

        { id: "fax", lead: 60, name: "Fax / analog adapter", link: "UC", handlers: ["remote", "onsite"],
          tag: "Secure e-fax, compliance-safe transmission",
          model: "device", size: [0.3, 0.1, 0.24], at: [[9.0, 0.85, -7.25]],
          summary: "Some industries still fax. We replace the old phone line with secure e-fax or a managed analog adapter, so faxes land in a protected inbox instead of a shared tray.",
          bullets: ["Secure e-fax to email or a portal", "Managed ATA (analog telephone adapter)", "Audit trail for sent and received faxes"] },

        { id: "staff", labelIndex: 3, name: "Staff", link: "SEC", handlers: ["remote", "soc"],
          tag: "Phishing training, security awareness",
          model: "person", at: [[-3.6, 0, -5.35], [-0.4, 0, -5.35], [2.8, 0, -5.35], [-3.6, 0, -1.95], [2.8, 0, -1.95], [6.0, 0, -1.95], [6.9, 0.05, 2.25]],
          summary: "People are the most targeted part of any business. We run short security awareness training and simulated phishing tests, so your team spots the tricks and knows who to call.",
          bullets: ["Security awareness training in short modules", "Simulated phishing campaigns", "Progress reports for owners", "A real person to ask, “Is this email legit?”"] }
      ]
    },

    /* ---------------- Zone 3 ---------------- */
    {
      id: "conference", group: "office", hotkey: "3",
      name: "Conference & Common Area",
      blurb: "Meetings, Wi-Fi, and the screens your guests see.",
      bounds: [-12, 0.6, 1, 8],
      objects: [
        { id: "av", name: "Conference room AV + camera", link: "UC", handlers: ["remote", "onsite"],
          tag: "Teams and Zoom rooms, one-touch join",
          items: [
            { model: "avwall", at: [[-11.9, 0, 4.3, 90]] },
            { model: "puck", at: [[-8.5, 0.74, 4.3]] }
          ],
          summary: "Meetings should start on time. We set up Microsoft Teams or Zoom rooms with one-touch join, a camera that frames the room, and audio people can actually hear.",
          bullets: ["Teams and Zoom room setup", "One-touch join from the calendar", "Camera, microphone, and display configuration", "Firmware updates and remote troubleshooting"] },

        { id: "tv", name: "Smart TV / lobby display", link: "NET", handlers: ["remote", "onsite"],
          tag: "Isolated network, patching",
          model: "tv", at: [[-4.92, 0, 3.6, 90]],
          summary: "Smart TVs are internet-connected computers that rarely get updated. We put them on an isolated network and keep them patched, so the lobby screen can never become a door into your files.",
          bullets: ["Isolated network segment", "Firmware and app updates", "Content and screen-casting setup"] },

        { id: "aps", name: "Wireless access points", link: "NET", handlers: ["remote", "onsite", "soc"],
          tag: "Coverage, roaming, rogue-AP detection",
          model: "ap", at: [[-2.0, 2.95, -4.5], [5.5, 2.95, -4.5], [-8.5, 2.95, 4.3], [-2.0, 2.95, 5.6]],
          labelAt: [-2.0, 3.3, 5.6],
          summary: "Good Wi-Fi is designed, not guessed. We place and tune access points for full coverage and smooth roaming between rooms, and we get an alert when an unknown rogue access point shows up.",
          bullets: ["Coverage planning and placement", "Seamless roaming between access points", "Rogue access point detection", "Centralized firmware management"] },

        { id: "guestwifi", name: "Guest Wi-Fi", link: "NET", handlers: ["remote"],
          tag: "Segmented from the business network",
          model: "apGuest", at: [[-1.2, 2.95, 1.6]],
          summary: "Visitors need internet, not access to your business. Guest Wi-Fi runs on its own segmented network with bandwidth limits, so a guest's laptop never sees your files or printers.",
          bullets: ["Segmented from the business network", "Bandwidth limits and time-based access", "Optional branded sign-in page"] }
      ]
    },

    /* ---------------- Zone 4 ---------------- */
    {
      id: "building", group: "office", hotkey: "4",
      name: "Building Systems",
      blurb: "Doors, cameras, alarms, payments, and the connected devices nobody tracks.",
      bounds: [1, 0, 12, 8],
      objects: [
        { id: "cameras", name: "Security cameras + NVR", link: "NET", handlers: ["remote", "onsite", "soc"],
          tag: "Segmented network, firmware, retention",
          items: [
            { model: "cam", at: [[-11.85, 2.8, -7.85, 45], [11.85, 2.8, -7.85, -45], [-11.85, 2.8, 7.85, 135], [8.0, 2.6, 8.05, 0]] },
            { model: "device", size: [0.5, 0.12, 0.38], at: [[10.8, 0.75, 0.5]] }
          ],
          labelAt: [9.5, 3.2, 4.5],
          summary: "Cameras protect your building, but a poorly managed one can expose your network. We isolate cameras on their own segment, keep firmware current, and set the NVR (network video recorder) to keep footage as long as you need it.",
          bullets: ["Segmented camera network", "Firmware updates and password hardening", "Retention settings matched to your policy", "Secure remote viewing"] },

        { id: "badge", name: "Badge readers / door access", link: "SEC", handlers: ["remote", "onsite"],
          tag: "Access control integration, audit logs",
          model: "badge", at: [[7.4, 1.15, 8.13]],
          summary: "Door access is security, and it is also IT. We tie access control to your user accounts, so a departing employee loses door access the same day, and every entry is logged.",
          bullets: ["Access control tied to user accounts", "Same-day badge removal at offboarding", "Entry audit logs", "Controller patching and network isolation"] },

        { id: "intercom", name: "Video intercom", link: "NET", handlers: ["remote", "onsite"],
          tag: "Network isolation, updates",
          model: "intercom", at: [[5.0, 1.35, 8.13]],
          summary: "A video intercom is a camera with a doorbell. We isolate it from your business network and keep it updated, so the front door never becomes a back door.",
          bullets: ["Network isolation", "Firmware updates", "Mobile app and answering setup"] },

        { id: "alarm", name: "Alarm panel", link: "NET", handlers: ["remote", "soc"],
          tag: "Connectivity monitoring",
          model: "alarm", at: [[2.6, 1.3, 0.07]],
          summary: "Your alarm only protects you if it can reach the monitoring company. We watch its network or cellular connection and flag it the moment the signal drops.",
          bullets: ["Connectivity monitoring", "Network isolation for internet-connected panels", "Coordination with your alarm provider"] },

        { id: "iot", name: "Smart thermostat / IoT devices", link: "SEC", handlers: ["soc", "remote"],
          tag: "Inventory and isolation: the stuff nobody tracks",
          items: [
            { model: "thermostat", at: [[4.2, 1.4, 0.07]] },
            { model: "speaker", at: [[8.4, 1.05, 3.0]] }
          ],
          summary: "The stuff nobody tracks. Smart thermostats, speakers, and plugs all join your Wi-Fi, and any one of them can be a way in. We find them, inventory them, and fence them off from your business data.",
          bullets: ["Discovery and inventory of connected devices", "Isolation on a dedicated IoT (Internet of Things) network", "Default password and firmware checks"] },

        { id: "pos", name: "POS / payment terminal", link: "CMP", handlers: ["remote", "onsite", "soc"], regulated: true,
          tag: "PCI-aware segmentation",
          model: "pos", at: [[5.6, 1.05, 3.1, 180]],
          summary: "If you take cards, your POS (point of sale) terminal handles your most sensitive data. We segment it from everything else to keep it inside a smaller, cleaner scope for PCI DSS (Payment Card Industry Data Security Standard).",
          bullets: ["PCI-aware network segmentation", "Terminal and software updates", "Coordination with your payment processor", "Help with scans and the annual questionnaire"],
          compliance: "PCI DSS applies to every system that stores, processes, or transmits card data. Segmentation can shrink how many systems are in scope, and we help you document it." }
      ]
    },

    /* ---------------- Cloud ---------------- */
    {
      id: "cloud", group: "cloud", hotkey: "5",
      name: "Cloud",
      blurb: "The services your business runs on, wherever your team works.",
      objects: [
        { id: "email", name: "Business email", link: "SEC", handlers: ["soc", "remote"], regulated: true, icon: "mail",
          tag: "Phishing filtering, impersonation defense",
          model: "tile", at: [[-8.6, 10.78, -6.6]],
          summary: "Email is where most attacks start. We filter spam and phishing before it reaches the inbox, block impersonation of you and your vendors, and turn on protections that Microsoft 365 leaves off by default.",
          bullets: ["Spam, malware, and phishing filtering", "Impersonation and spoofing defense", "Link and attachment scanning", "Mailbox monitoring by the CMIT SOC"],
          compliance: "Email is a common place for patient and customer data to leak. Message encryption and data loss prevention rules support HIPAA and FTC Safeguards Rule obligations." },

        { id: "identity", name: "Identity & MFA", link: "SEC", handlers: ["soc", "remote"], icon: "lock",
          tag: "Single sign-on, conditional access, MFA everywhere",
          model: "tile", at: [[-4.4, 10.78, -6.6]],
          summary: "Your login is the new front door. We set up single sign-on (one login for every app), conditional access that checks where and how people sign in, and MFA (multi-factor authentication) everywhere.",
          bullets: ["Single sign-on across your apps", "Conditional access by device and location", "MFA for every user", "Same-day onboarding and offboarding"] },

        { id: "files", name: "Files & sharing (OneDrive / SharePoint)", link: "CLD", handlers: ["soc", "remote"], regulated: true, icon: "folder",
          tag: "Permissions, retention, ransomware rollback",
          model: "tile", at: [[-0.2, 10.78, -6.6]],
          summary: "Your files live in Microsoft 365 now, which makes sharing easy, sometimes too easy. We set permissions, retention, and version history, so one bad click or a ransomware event can be rolled back.",
          bullets: ["Permissions and sharing policies", "Retention and version history", "Ransomware rollback", "Migration from old file servers"],
          compliance: "Retention rules and access reviews help show HIPAA and FTC Safeguards Rule auditors who can open sensitive files and how long you keep them." },

        { id: "teams", name: "Teams & collaboration", link: "APP", handlers: ["remote"], icon: "chat",
          tag: "Governance, external sharing controls",
          model: "tile", at: [[-8.6, 10.78, -3.5]],
          summary: "Teams is your office's group chat, meeting room, and file hub in one place. We set governance so channels don't sprawl, and we control what can be shared with people outside the company.",
          bullets: ["Team and channel governance", "External sharing and guest access controls", "Meeting and calling policies", "Training for your staff"] },

        { id: "web", name: "Website, domain & DNS", link: "CLD", handlers: ["remote"], icon: "globe",
          tag: "Domain lock, SSL, SPF/DKIM/DMARC",
          model: "tile", at: [[-4.4, 10.78, -3.5]],
          summary: "Your domain is the root of your email and your website. We lock it against hijacking, keep SSL certificates valid, and set up SPF, DKIM, and DMARC (email authentication records) so nobody can send email pretending to be you.",
          bullets: ["Domain registrar lock and renewal tracking", "SSL certificate monitoring", "SPF, DKIM, and DMARC setup", "DNS (domain name system) management"] },

        { id: "lob", name: "Line-of-business apps (EHR, accounting, CRM)", link: "APP", handlers: ["remote"], regulated: true, icon: "apps",
          tag: "Vendor coordination, access reviews",
          model: "tile", at: [[-0.2, 10.78, -3.5]],
          summary: "This is the software that runs your business: an EHR (electronic health record), accounting, or CRM (customer relationship management) system. We coordinate with the vendor, handle updates, and review who has access.",
          bullets: ["Vendor coordination and escalation", "Updates and integration support", "Regular access reviews", "Onboarding and offboarding in every app"],
          compliance: "These apps hold your most regulated data. Access reviews and audit logs support HIPAA, the FTC Safeguards Rule, and your client contract requirements." },

        { id: "cloudbackup", name: "Cloud backup (M365 + servers)", link: "BKP", handlers: ["soc", "remote"], regulated: true, icon: "upload",
          tag: "Offsite immutable copies",
          model: "tile", at: [[-8.6, 10.78, -0.4]],
          summary: "Microsoft keeps 365 running, but recovering your deleted or encrypted data is your job. We back up email, OneDrive, SharePoint, and Teams, plus your servers, to immutable offsite storage that can't be altered or deleted.",
          bullets: ["Microsoft 365 backup", "Offsite server backup", "Immutable, tamper-proof copies", "Tested restores"],
          compliance: "Immutable offsite copies support the backup and disaster recovery expectations in HIPAA and the FTC Safeguards Rule." },

        { id: "phonesys", name: "Hosted phone system", link: "UC", handlers: ["remote"], icon: "phone",
          tag: "Auto-attendant, mobile app, call recording",
          model: "tile", at: [[-4.4, 10.78, -0.4]],
          summary: "Your phone system lives in the cloud, so it follows your team anywhere. We set up the auto-attendant, mobile apps, and call recording, and we change them whenever you need.",
          bullets: ["Auto-attendant and call flows", "Mobile and desktop apps", "Call recording and voicemail-to-email", "Number porting handled for you"] },

        { id: "ai", name: "AI & automation", link: "AI", handlers: ["remote"], icon: "spark",
          tag: "Managed AI tools, workflow automation, guardrails",
          model: "tile", at: [[-0.2, 10.78, -0.4]],
          summary: "AI can save your team hours every week, as long as it is set up safely. We deploy managed AI tools, automate repetitive workflows, and put guardrails in place so company data stays where it belongs.",
          bullets: ["Managed AI tools such as Microsoft Copilot", "Workflow automation between your apps", "Data guardrails and usage policies", "Staff training on safe, effective use"] }
      ]
    },

    /* ---------------- CMIT Team ---------------- */
    {
      id: "team", group: "team",
      name: "CMIT Team",
      blurb: "The people behind the coverage: watching, fixing, and showing up.",
      labelAt: [21, 4.6, -0.6],
      objects: [
        { id: "soc", name: "Security Operations Center", link: "MDR", handlers: ["soc"], hotkey: "6",
          tag: "24/7 threat detection and response",
          model: "soc", at: [[21, 0.12, -5.5]],
          summary: "Our SOC (security operations center) watches your environment 24/7/365. It is the MDR (managed detection and response) team that triages every alert, shuts down real threats, and tells you what happened in plain English.",
          bullets: ["24/7 threat detection and response", "Alert triage, so you are never drowning in noise", "Endpoint, email, and identity monitoring", "Incident reports written for owners"] },

        { id: "remote", name: "Remote Support", link: "SUP", handlers: ["remote"], hotkey: "7",
          tag: "Fast helpdesk, remote fixes, proactive maintenance",
          model: "helpdesk", at: [[21, 0.12, 4.5, -30]],
          summary: "Your helpdesk, staffed by people who know your setup. Most issues get fixed remotely, and routine maintenance happens after hours, so your team keeps working.",
          bullets: ["Fast, friendly helpdesk", "Remote fixes without waiting for a visit", "Proactive maintenance and patching", "One number to call for anything tech"] },

        { id: "truck", name: "In-Person Support", link: "PROC", handlers: ["onsite"], hotkey: "8",
          tag: "On-site installs, hardware swaps, buildouts",
          model: "truck", at: [[5.5, 0, 12.3]],
          drive: [[0, 0], [9, 0], [11.2, 1.8], [9, 3.6], [-4, 3.6], [-6.2, 1.8], [-4, 0]],
          summary: "When something needs hands, we come to you. Our technicians handle on-site installs, hardware swaps, and new-office buildouts across Northern New Jersey.",
          bullets: ["On-site installs and hardware swaps", "New-location and office-move buildouts", "Equipment sourcing and procurement", "Cabling and network installs"] }
      ]
    }
  ],

  /* ---------------------------------------------------------------------- */
  /* Data View. `links` are [from, to] object ids. `both` = packets travel both
     ways. `auto: "monitored"` builds one link from every office object to `to`. */
  flows: [
    { id: "email",     label: "Email",              color: "bright-blue", rate: 0.9, speed: 6, both: true,
      links: [["workstations", "firewall"], ["firewall", "email"]] },
    { id: "files",     label: "File sync",          color: "bright-blue", rate: 0.6, speed: 6, both: true,
      links: [["laptops", "files"], ["nas", "files"]] },
    { id: "backup",    label: "Backup",             color: "paper",       rate: 1.0, speed: 5,
      links: [["server", "backup"], ["nas", "backup"], ["backup", "cloudbackup"]] },
    { id: "telemetry", label: "Monitoring telemetry", color: "slate",     rate: 0.22, speed: 4.5, width: 0.012, size: 0.6,
      auto: "monitored", to: "soc" },
    { id: "support",   label: "Remote support session", color: "orange",  rate: 2.4, speed: 7, both: true, burst: true,
      links: [["remote", "workstations"]] },
    { id: "dispatch",  label: "Dispatch",           color: "orange",      rate: 0.35, speed: 6,
      links: [["remote", "truck"], ["truck", "badge"]] },
    { id: "calls",     label: "Calls",              color: "green",       rate: 0.3, speed: 6, both: true,
      links: [["voip", "phonesys"]] }
  ],

  dataView: {
    threatEvery: 6,
    origins: [[-34, 9, -30], [38, 14, -34], [-30, 16, 26], [8, 24, -44], [42, 8, 20]]
  },

  /* Threat toasts, rotated in order. Target is "firewall" or "email". */
  threats: [
    { target: "email",    text: "Phishing email blocked by the CMIT SOC." },
    { target: "firewall", text: "Ransomware download stopped at the firewall. Nobody had to unplug anything." },
    { target: "email",    text: "Credential-stuffing attempt locked out. Those passwords were never going to work." },
    { target: "email",    text: "Spoofed invoice quarantined. Accounts payable never saw it." },
    { target: "firewall", text: "Sign-in from overseas blocked and flagged by the CMIT SOC." }
  ],

  /* Static furniture and building shell (ghosted x-ray glass). */
  layout: {
    shell: [
      { model: "wall", size: [24, 3.2, 0.15], at: [[0, 0, -8]] },
      { model: "wall", size: [0.15, 3.2, 16], at: [[-12, 0, 0]] },
      { model: "wall", size: [0.12, 3.2, 4.6], at: [[-6, 0, -5.7]] },
      { model: "wall", size: [4.2, 3.2, 0.12], at: [[-9.9, 0, -1]] },
      { model: "wall", size: [7, 3.2, 0.1], at: [[-8.5, 0, 0.6]] },
      { model: "wall", size: [0.1, 3.2, 6.4], at: [[-5, 0, 4.8]] },
      { model: "wall", size: [4, 3.2, 0.12], at: [[3, 0, 0]] },
      { model: "wall", size: [4.6, 3.2, 0.12], at: [[9.7, 0, 0]] },
      { model: "doorframe", at: [[6.2, 0, 8]] },
      { model: "desk", at: [[-3.6, 0, -6.2], [-0.4, 0, -6.2], [2.8, 0, -6.2], [6.0, 0, -6.2], [-3.6, 0, -2.8], [-0.4, 0, -2.8], [2.8, 0, -2.8], [6.0, 0, -2.8]] },
      { model: "chair", at: [[-3.6, 0, -5.45], [-0.4, 0, -5.45], [2.8, 0, -5.45], [6.0, 0, -5.45], [-3.6, 0, -2.05], [-0.4, 0, -2.05], [2.8, 0, -2.05], [6.0, 0, -2.05],
                             [-9.7, 0, 3.25, 180], [-8.5, 0, 3.25, 180], [-7.3, 0, 3.25, 180], [-9.7, 0, 5.35], [-8.5, 0, 5.35], [-7.3, 0, 5.35]] },
      { model: "block", size: [3.6, 0.74, 1.4], at: [[-8.5, 0, 4.3]] },
      { model: "block", size: [2.0, 0.8, 0.6], at: [[-7.4, 0, -7.2]] },
      { model: "block", size: [0.5, 0.85, 0.45], at: [[9.0, 0, -7.25]] },
      { model: "block", size: [1.3, 0.75, 0.65], at: [[10.5, 0, -4.6]] },
      { model: "block", size: [0.9, 0.75, 0.5], at: [[10.8, 0, 0.5]] },
      { model: "block", size: [3.2, 1.05, 0.7], at: [[6.5, 0, 3.0]] },
      { model: "block", size: [1.1, 0.4, 0.6], at: [[-2.9, 0, 3.6]] },
      { model: "couch", at: [[-1.1, 0, 3.6, -90]] }
    ],
    cloudPlatform: { center: [-4.4, 10.6, -3.5], size: [13.6, 0.12, 9.6] },
    pads: [
      { center: [21, -5.5], size: [7.2, 6] },
      { center: [21, 4.5], size: [7.2, 6.4] }
    ],
    paths: [
      { from: [12, -5.5], to: [17.4, -5.5] },
      { from: [12, 4.5], to: [17.4, 4.5] },
      { from: [6.2, 8], to: [6.2, 10.6] }
    ],
    road: { center: [7, 12.6], size: [52, 3.6] }
  }
};
