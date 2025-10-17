// Enhanced Report Parser
const ReportParser = {
    parseMarkdownReport: function(markdown) {
        const sections = {
            title: '',
            description: '',
            keyCharacteristics: [],
            dailyImpact: [],
            developmentStrategy: [],
            recommendedExercises: []
        };

        if (!markdown) return sections;

        const lines = markdown.split('\n').filter(line => line.trim());
        
        let currentSection = 'description';
        
        lines.forEach(line => {
            line = line.trim();
            
            // Detect section headers
            if (line.includes('**Key Characteristics**')) {
                currentSection = 'keyCharacteristics';
                return;
            }
            if (line.includes('**Impact on Daily Life**')) {
                currentSection = 'dailyImpact';
                return;
            }
            if (line.includes('**Development Strategy**')) {
                currentSection = 'developmentStrategy';
                return;
            }
            if (line.includes('**Recommended Exercises**')) {
                currentSection = 'recommendedExercises';
                return;
            }
            
            // Parse content based on current section
            if (currentSection === 'description' && !sections.title) {
                if (line && !line.startsWith('**') && !line.startsWith('•')) {
                    if (!sections.title) {
                        sections.title = line;
                    } else if (!sections.description) {
                        sections.description = line;
                    }
                }
            }
            
            // Parse bullet points
            if (line.startsWith('•') || line.startsWith('-')) {
                const content = line.substring(1).trim();
                if (content) {
                    sections[currentSection].push(content);
                }
            }
            
            // Parse regular lines for description
            if (currentSection === 'description' && line && 
                !line.startsWith('**') && !line.startsWith('•') && 
                line !== sections.title) {
                sections.description += ' ' + line;
            }
        });

        // Clean up description
        sections.description = sections.description.trim();

        return sections;
    },

    getSectionIcon: function(sectionName) {
        const icons = {
            keyCharacteristics: '🎯',
            dailyImpact: '💫', 
            developmentStrategy: '🚀',
            recommendedExercises: '🛠️'
        };
        return icons[sectionName] || '📝';
    },

    getSectionTitle: function(sectionName) {
        const titles = {
            keyCharacteristics: 'Your Superpower Traits',
            dailyImpact: 'How This Shows Up Daily',
            developmentStrategy: 'Your Growth Blueprint', 
            recommendedExercises: 'Superpower Training'
        };
        return titles[sectionName] || sectionName;
    }
};