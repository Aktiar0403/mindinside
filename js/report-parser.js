// 🔥 Inside Mind Enhanced Report Parser v2
const ReportParser = {
    parseMarkdownReport: function(markdown) {
        const sections = {
            title: '',
            level: '',
            proficiency: '',
            description: '',
            scienceSnapshot: [],
            keyCharacteristics: [],
            dailyImpact: [],
            developmentStrategy: [],
            recommendedExercises: [],
            growthPath: []
        };

        if (!markdown) return sections;

        const lines = markdown.split('\n').filter(line => line.trim());
        let currentSection = 'description';

        lines.forEach(line => {
            line = line.trim();

            // Detect Level or Proficiency
            if (/Level\s*\d+/i.test(line)) {
                sections.level = line.match(/Level\s*\d+/i)[0];
                return;
            }
            if (/Proficiency/i.test(line)) {
                sections.proficiency = line;
                return;
            }

            // Detect Section Headers
            if (line.includes('**Science Snapshot**')) {
                currentSection = 'scienceSnapshot'; return;
            }
            if (line.includes('**Key Characteristics**')) {
                currentSection = 'keyCharacteristics'; return;
            }
            if (line.includes('**Impact on Daily Life**')) {
                currentSection = 'dailyImpact'; return;
            }
            if (line.includes('**Development Strategy**')) {
                currentSection = 'developmentStrategy'; return;
            }
            if (line.includes('**Recommended Exercises**')) {
                currentSection = 'recommendedExercises'; return;
            }
            if (line.includes('**Growth Path**') || line.includes('**Long-term Growth Path**')) {
                currentSection = 'growthPath'; return;
            }

            // Detect Title
            if (line.startsWith('##') || line.startsWith('#')) {
                sections.title = line.replace(/#+\s*/, '').trim();
                currentSection = 'description';
                return;
            }

            // Parse bullet points
            if (line.startsWith('•') || line.startsWith('-')) {
                const content = line.substring(1).trim();
                if (content) sections[currentSection].push(content);
                return;
            }

            // Regular text
            if (currentSection === 'description' && line &&
                !line.startsWith('**') && !line.startsWith('•') && !line.startsWith('-')) {
                sections.description += (sections.description ? ' ' : '') + line;
            }
        });

        // Clean array sections
        Object.keys(sections).forEach(k => {
            if (Array.isArray(sections[k])) {
                sections[k] = sections[k].filter(item => item.trim());
            }
        });

        sections.description = sections.description.trim();
        return sections;
    },

    // 🔹 Icons for each section
    getSectionIcon: function(sectionName) {
        const icons = {
            scienceSnapshot: '📊',
            keyCharacteristics: '🎯',
            dailyImpact: '💫',
            developmentStrategy: '🚀',
            recommendedExercises: '🛠️',
            growthPath: '🧭'
        };
        return icons[sectionName] || '📝';
    },

    // 🔹 Human-friendly titles
    getSectionTitle: function(sectionName) {
        const titles = {
            scienceSnapshot: 'Science Snapshot',
            keyCharacteristics: 'Your Superpower Traits',
            dailyImpact: 'How This Shows Up Daily',
            developmentStrategy: 'Your Growth Blueprint',
            recommendedExercises: 'Superpower Training',
            growthPath: 'Your Long-Term Path'
        };
        return titles[sectionName] || sectionName;
    }
};
