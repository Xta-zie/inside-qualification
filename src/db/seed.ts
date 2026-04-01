import { db } from './index';
import { users, questions, baselines, trainingModules } from './schema';

// ============================================================================
// Seed data
// ============================================================================

const questionsData = [
  {
    key: "linux_sys",
    category: "1. Administration Syst\u00e8me Linux",
    sortOrder: 1,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je connais les commandes de base (ls, cd, cp, grep).",
      "Je g\u00e8re les paquets, les utilisateurs, les droits (chmod/chown) et les services simples.",
      "Je ma\u00eetrise systemd (cr\u00e9ation de services), LVM (\u00e9tendre un FS \u00e0 chaud) et le partitionnement.",
      "Expert : Je ma\u00eetrise les cgroups, les namespaces r\u00e9seau/process, et l'architecture de boot (GRUB/Initramfs).",
    ],
  },
  {
    key: "linux_troubleshoot",
    category: "2. Troubleshooting & Perf Linux",
    sortOrder: 2,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais utiliser 'top' et lire un fichier dans /var/log/.",
      "Je sais utiliser journalctl, dmesg, et interpr\u00e9ter la charge CPU/RAM basique.",
      "Je ma\u00eetrise strace, tcpdump, lsof, iostat et je peux isoler un probl\u00e8me d'I/O Wait ou de swap.",
      "Expert : J'analyse des Kernel Panics, j'utilise perf/eBPF, et je tune les param\u00e8tres sysctl avanc\u00e9s.",
    ],
  },
  {
    key: "net_l2_l3",
    category: "3. R\u00e9seau L2/L3 & Datacenter",
    sortOrder: 3,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je connais la diff\u00e9rence entre une adresse IP, un masque et une passerelle.",
      "Je sais configurer des VLANs, du Bonding (LACP) et du routage statique sous Linux.",
      "Je ma\u00eetrise le routage dynamique basique et les concepts de filtrage (iptables/nftables).",
      "Expert : Je design et d\u00e9panne des architectures de fabric Datacenter (BGP EVPN, Spine-Leaf).",
    ],
  },
  {
    key: "net_sdn",
    category: "4. SDN & Open vSwitch (OVS)",
    sortOrder: 4,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je comprends le concept de switch virtuel.",
      "Je sais cr\u00e9er un pont OVS (ovs-vsctl) et y attacher des interfaces.",
      "Je ma\u00eetrise les encapsulations (VXLAN, Geneve) et je sais lire les tables de flux OVS (ovs-ofctl).",
      "Expert : Je d\u00e9panne des flux complexes, des probl\u00e8mes de MTU dans les tunnels et je connais DPDK/SmartNICs.",
    ],
  },
  {
    key: "virt_kvm",
    category: "5. Virtualisation (KVM / Libvirt)",
    sortOrder: 5,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais ce qu'est un hyperviseur et une machine virtuelle.",
      "J'ai d\u00e9j\u00e0 cr\u00e9\u00e9 des VMs sous KVM via une interface graphique (Virt-Manager).",
      "Je ma\u00eetrise Libvirt (virsh, \u00e9dition de XML), les formats qcow2, et la gestion des snapshots.",
      "Expert : Je ma\u00eetrise le Passthrough PCI/GPU, le CPU Pinning, la topologie NUMA et la live-migration bas niveau.",
    ],
  },
  {
    key: "os_identity",
    category: "6. OpenStack : Identity (Keystone)",
    sortOrder: 6,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais que Keystone g\u00e8re les mots de passe et les tokens.",
      "Je sais cr\u00e9er des utilisateurs, des projets et assigner des r\u00f4les via la CLI (openstack user create).",
      "Je comprends le catalogue de services, les endpoints, et les concepts de Domaines.",
      "Expert : Je g\u00e8re la f\u00e9d\u00e9ration d'identit\u00e9 (SAML/OIDC), j'audite les policies (policy.json) et je debug les tokens Fernet.",
    ],
  },
  {
    key: "os_compute",
    category: "7. OpenStack : Compute (Nova & Glance)",
    sortOrder: 7,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais lancer une instance (VM) depuis le dashboard Horizon.",
      "Je sais cr\u00e9er des Flavors, g\u00e9rer des images Glance et d\u00e9marrer des VMs via la CLI.",
      "Je comprends l'architecture Nova (API, Conductor, Scheduler, Compute) et le placement (Host Aggregates).",
      "Expert : Je debug des \u00e9checs de scheduling, je g\u00e8re l'architecture Cell V2, et j'interviens dans la DB Nova.",
    ],
  },
  {
    key: "os_network",
    category: "8. OpenStack : Network (Neutron)",
    sortOrder: 8,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais associer une Floating IP et g\u00e9rer les r\u00e8gles de Security Groups depuis Horizon.",
      "Je sais cr\u00e9er des r\u00e9seaux Provider et Tenant (Self-service), ainsi que des routeurs via la CLI.",
      "Je comprends o\u00f9 sont instanci\u00e9s les routeurs virtuels (qrouter namespaces), le r\u00f4le de DHCP agent et L3 agent.",
      "Expert : Je ma\u00eetrise l'architecture Distributed Virtual Router (DVR), le L3 HA, et la migration vers OVN.",
    ],
  },
  {
    key: "storage_block",
    category: "9. Stockage Bloc & Objet (Cinder/Swift)",
    sortOrder: 9,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais attacher un volume \u00e0 une instance OpenStack.",
      "Je sais cr\u00e9er des types de volumes (Volume Types) et utiliser LVM comme backend Cinder.",
      "Je g\u00e8re des backends multiples, les snapshots Cinder, et je comprends le fonctionnement de Swift (Objet).",
      "Expert : Je d\u00e9panne les probl\u00e8mes de multipathing iSCSI/Fibre Channel entre le compute et la baie de stockage.",
    ],
  },
  {
    key: "storage_ceph",
    category: "10. Stockage Distribu\u00e9 (Ceph)",
    sortOrder: 10,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je connais le nom Ceph et je sais qu'il permet de stocker des donn\u00e9es.",
      "Je sais v\u00e9rifier l'\u00e9tat d'un cluster Ceph (ceph -s) et comprendre les concepts OSD / MON.",
      "Je ma\u00eetrise la cr\u00e9ation de pools, la CRUSH map, et l'int\u00e9gration native avec Cinder/Glance.",
      "Expert : Je g\u00e8re les recoveries complexes (PGs inconsistent/stale), le tuning de perf IOPS et l'ajout de n\u0153uds \u00e0 chaud.",
    ],
  },
  {
    key: "ops_automation",
    category: "11. Automatisation (Ansible & IaC)",
    sortOrder: 11,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais \u00e9crire un script Bash s\u00e9quentiel simple.",
      "Je sais \u00e9crire un playbook Ansible basique pour installer des paquets et pousser des templates.",
      "Je ma\u00eetrise les Roles, les Variables/Facts, et l'utilisation de modules OpenStack dans Ansible.",
      "Expert : Je d\u00e9ploie OpenStack via Kolla-Ansible / OpenStack-Ansible, j'\u00e9cris des modules custom et je g\u00e8re l'IaC via CI/CD.",
    ],
  },
  {
    key: "ops_monitor",
    category: "12. Op\u00e9rations & Supervision",
    sortOrder: 12,
    levels: [
      "Je ne connais pas du tout ou je n'ai aucune comp\u00e9tence.",
      "Je sais regarder un dashboard Grafana ou Zabbix.",
      "Je sais configurer des alertes simples et g\u00e9rer l'arr\u00eat/relance propre de services (RabbitMQ, MariaDB).",
      "Je ma\u00eetrise la stack ELK pour corr\u00e9ler les logs OpenStack, le tracing RabbitMQ, et Galera Cluster.",
      "Expert : Je mets en place de l'auto-rem\u00e9diation, du Chaos Engineering et un Plan de Reprise d'Activit\u00e9 (PRA) complet.",
    ],
  },
];

const baselinesData = [
  {
    roleKey: "sysadmin",
    label: "Ing\u00e9nieur Syst\u00e8me",
    description:
      "Focus sur l'impl\u00e9mentation, le d\u00e9ploiement et le maintien de la couche basse.",
    targets: {
      linux_sys: 4,
      linux_troubleshoot: 3,
      net_l2_l3: 4,
      net_sdn: 3,
      virt_kvm: 4,
      os_identity: 3,
      os_compute: 4,
      os_network: 3,
      storage_block: 4,
      storage_ceph: 2,
      ops_automation: 3,
      ops_monitor: 3,
    },
  },
  {
    roleKey: "architect",
    label: "Architecte Cloud",
    description:
      "Focus sur le design, le scaling, le choix des composants et l'int\u00e9gration SI.",
    targets: {
      linux_sys: 3,
      linux_troubleshoot: 2,
      net_l2_l3: 4,
      net_sdn: 4,
      virt_kvm: 3,
      os_identity: 4,
      os_compute: 4,
      os_network: 4,
      storage_block: 3,
      storage_ceph: 4,
      ops_automation: 2,
      ops_monitor: 2,
    },
  },
  {
    roleKey: "ops",
    label: "Ing\u00e9nieur Production",
    description:
      "Focus sur le MCO, le troubleshooting, le monitoring et la gestion d'incidents.",
    targets: {
      linux_sys: 4,
      linux_troubleshoot: 4,
      net_l2_l3: 3,
      net_sdn: 3,
      virt_kvm: 3,
      os_identity: 3,
      os_compute: 3,
      os_network: 3,
      storage_block: 3,
      storage_ceph: 3,
      ops_automation: 4,
      ops_monitor: 4,
    },
  },
];

const trainingModulesData = [
  {
    moduleKey: "mod_linux",
    title: "Administration Linux Avanc\u00e9e & Perf",
    content:
      "Ma\u00eetrise des Namespaces, Cgroups, Kernel Tuning, Systemd et outils de troubleshooting.",
    linkedQuestionKeys: ["linux_sys", "linux_troubleshoot"],
    providers: [
      {
        name: "Red Hat",
        type: "Certifiant",
        detail: "RHCSA / RHCE Certification Track",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "Linux Kernel Internals & Debugging",
      },
    ],
  },
  {
    moduleKey: "mod_net",
    title: "R\u00e9seaux Datacenter, SDN & OVS",
    content:
      "Routage avanc\u00e9, VXLAN, int\u00e9gration Open vSwitch et SDN bas niveau.",
    linkedQuestionKeys: ["net_l2_l3", "net_sdn"],
    providers: [
      {
        name: "Red Hat",
        type: "Expert",
        detail: "CL310 - OpenStack Networking & NFV",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "Open vSwitch & SDN Fundamentals",
      },
    ],
  },
  {
    moduleKey: "mod_virt",
    title: "Virtualisation KVM Under the Hood",
    content:
      "Architecture Libvirt/QEMU, XML editing, optimisation NUMA et PCI Passthrough.",
    linkedQuestionKeys: ["virt_kvm"],
    providers: [
      {
        name: "Red Hat",
        type: "Sp\u00e9cialisation",
        detail: "RH318 - Red Hat Virtualization",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "KVM Hypervisor Masterclass",
      },
    ],
  },
  {
    moduleKey: "mod_os_core",
    title: "OpenStack Core : Compute & Identity",
    content:
      "Architecture distribu\u00e9e de Nova et Keystone, debugging RPC, politiques d'acc\u00e8s.",
    linkedQuestionKeys: ["os_identity", "os_compute"],
    providers: [
      {
        name: "Red Hat",
        type: "Reference",
        detail: "CL210 - Red Hat OpenStack Administration II",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "OpenStack Fundamentals & Architecture",
      },
    ],
  },
  {
    moduleKey: "mod_os_net",
    title: "OpenStack Neutron & Architecture R\u00e9seau",
    content:
      "Gestion des agents DHCP/L3, routeurs virtuels, DVR et d\u00e9pannage des flux.",
    linkedQuestionKeys: ["os_network"],
    providers: [
      {
        name: "Red Hat",
        type: "Expert",
        detail: "CL310 - OpenStack Networking",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "OpenStack Neutron Deep Dive",
      },
    ],
  },
  {
    moduleKey: "mod_storage",
    title: "Ceph & Stockage Cloud",
    content:
      "Administration Ceph (CRUSH map, OSDs), int\u00e9gration Cinder LVM/Ceph et d\u00e9pannage.",
    linkedQuestionKeys: ["storage_block", "storage_ceph"],
    providers: [
      {
        name: "Red Hat",
        type: "Expert",
        detail: "CEPH125 - Red Hat Ceph Storage",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "Ceph Cluster Administration",
      },
    ],
  },
  {
    moduleKey: "mod_ops",
    title: "Automatisation, Ansible & Op\u00e9rations",
    content:
      "Ansible pour le Cloud (Kolla), gestion des clusters Galera/RabbitMQ, et supervision avanc\u00e9e.",
    linkedQuestionKeys: ["ops_automation", "ops_monitor"],
    providers: [
      {
        name: "Red Hat",
        type: "Automation",
        detail: "DO407 - Automation with Ansible",
      },
      {
        name: "Udemy",
        type: "E-learning",
        detail: "Ansible for DevOps & OpenStack Operators",
      },
    ],
  },
];

// ============================================================================
// Seed function
// ============================================================================

async function seed() {
  console.log("--- Starting database seed ---\n");

  try {
    // ----- Test Users -----
    const testUsers = [
      { id: "test-admin-001", name: "Admin INSIDE", email: "admin@inside.fr", role: "admin" as const },
      { id: "test-manager-001", name: "Manager INSIDE", email: "manager@inside.fr", role: "manager" as const },
      { id: "test-user-001", name: "User INSIDE", email: "user@inside.fr", role: "user" as const },
    ];
    console.log(`Seeding ${testUsers.length} test users...`);
    for (const u of testUsers) {
      await db
        .insert(users)
        .values(u)
        .onConflictDoUpdate({
          target: users.email,
          set: { name: u.name, role: u.role },
        });
      console.log(`  [user] ${u.email} (${u.role})`);
    }
    console.log("Test users seeded.\n");

    // ----- Questions -----
    console.log(`Seeding ${questionsData.length} questions...`);
    for (const q of questionsData) {
      await db
        .insert(questions)
        .values({
          key: q.key,
          category: q.category,
          sortOrder: q.sortOrder,
          levels: q.levels,
        })
        .onConflictDoUpdate({
          target: questions.key,
          set: {
            category: q.category,
            sortOrder: q.sortOrder,
            levels: q.levels,
            updatedAt: new Date(),
          },
        });
      console.log(`  [question] ${q.key}`);
    }
    console.log("Questions seeded.\n");

    // ----- Baselines -----
    console.log(`Seeding ${baselinesData.length} baselines...`);
    for (const b of baselinesData) {
      await db
        .insert(baselines)
        .values({
          roleKey: b.roleKey,
          label: b.label,
          description: b.description,
          targets: b.targets,
        })
        .onConflictDoUpdate({
          target: baselines.roleKey,
          set: {
            label: b.label,
            description: b.description,
            targets: b.targets,
            updatedAt: new Date(),
          },
        });
      console.log(`  [baseline] ${b.roleKey}`);
    }
    console.log("Baselines seeded.\n");

    // ----- Training Modules -----
    console.log(`Seeding ${trainingModulesData.length} training modules...`);
    for (const m of trainingModulesData) {
      await db
        .insert(trainingModules)
        .values({
          moduleKey: m.moduleKey,
          title: m.title,
          content: m.content,
          linkedQuestionKeys: m.linkedQuestionKeys,
          providers: m.providers,
        })
        .onConflictDoUpdate({
          target: trainingModules.moduleKey,
          set: {
            title: m.title,
            content: m.content,
            linkedQuestionKeys: m.linkedQuestionKeys,
            providers: m.providers,
            updatedAt: new Date(),
          },
        });
      console.log(`  [module] ${m.moduleKey}`);
    }
    console.log("Training modules seeded.\n");

    console.log("--- Seed completed successfully ---");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
