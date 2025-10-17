// js/pdf-generator.js - Complete PDF Generation System
const PDFGenerator = {
    async generateReport(userData, results, reportsContent) {
        try {
            // Check if jsPDF is available
            if (typeof jspdf === 'undefined') {
                console.error('jsPDF not loaded');
                return false;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set initial coordinates
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // ===== COVER PAGE =====
            this.addCoverPage(doc, userData, results);
            
            // ===== SUMMARY PAGE =====  
            doc.addPage();
            yPosition = 20;
            yPosition = this.addSummaryPage(doc, results, yPosition, margin, contentWidth);

            // ===== DETAILED REPORTS =====
            for (const [category, result] of Object.entries(results)) {
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                yPosition = this.addCategoryReport(
                    doc, 
                    category, 
                    result, 
                    reportsContent[category], 
                    yPosition, 
                    margin, 
                    contentWidth
                );
                
                yPosition += 15; // Space between categories
            }

            // ===== ACTION PLAN PAGE =====
            doc.addPage();
            this.addActionPlan(doc, results, margin, contentWidth);

            // Generate filename
            const fileName = `MindInsight_Report_${userData.demographics.name}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Save the PDF
            doc.save(fileName);
            return true;

        } catch (error) {
            console.error('PDF generation error:', error);
            return false;
        }
    },

    addCoverPage(doc, userData, results) {
        const pageWidth = doc.internal.pageSize.width;
        
        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Mind Insight Pro', pageWidth / 2, 60, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text('Psychological Assessment Report', pageWidth / 2, 80, { align: 'center' });
        
        // User Info
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Name: ${userData.demographics.name}`, pageWidth / 2, 120, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 135, { align: 'center' });
        
        // Overall Score
        const overallScore = Object.values(results).reduce((sum, result) => sum + result.overall, 0) / Object.keys(results).length;
        doc.setFontSize(18);
        doc.setTextColor(102, 126, 234);
        doc.text(`Overall Score: ${overallScore.toFixed(1)}/5.0`, pageWidth / 2, 160, { align: 'center' });
        
        // Decorative line
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.5);
        doc.line(50, 180, pageWidth - 50, 180);
        
        // Confidentiality notice
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('Confidential Assessment Report - For Personal Use Only', pageWidth / 2, 270, { align: 'center' });
    },

    addSummaryPage(doc, results, yPosition, margin, contentWidth) {
        // Page title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Assessment Summary', margin, yPosition);
        yPosition += 25;

        // Overall score
        const overallScore = Object.values(results).reduce((sum, result) => sum + result.overall, 0) / Object.keys(results).length;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Overall Psychological Score: ${overallScore.toFixed(1)}/5.0`, margin, yPosition);
        yPosition += 20;

        // Category scores
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Breakdown:', margin, yPosition);
        yPosition += 15;

        doc.setFont('helvetica', 'normal');
        for (const [category, result] of Object.entries(results)) {
            const levelLabel = ScoringAlgorithm.getLevelLabel(result.level);
            doc.text(`${category}: ${result.overall.toFixed(1)} (${levelLabel})`, margin + 10, yPosition);
            yPosition += 8;
            
            // Add subcategory details if space allows
            if (yPosition < 250) {
                for (const [subcategory, subResult] of Object.entries(result.subcategories)) {
                    doc.setFontSize(10);
                    doc.text(`  ${subcategory}: ${subResult.score.toFixed(1)}`, margin + 20, yPosition);
                    yPosition += 6;
                }
                doc.setFontSize(12);
            }
            
            yPosition += 5;
            
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }
        }

        return yPosition;
    },

    addCategoryReport(doc, category, result, reportContent, yPosition, margin, contentWidth) {
        // Category header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text(`${category} - Level ${result.level}`, margin, yPosition);
        yPosition += 12;

        // Score
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Score: ${result.overall.toFixed(1)}/5.0 - ${ScoringAlgorithm.getLevelLabel(result.level)}`, margin, yPosition);
        yPosition += 15;

        // Parse and add report content
        if (reportContent) {
            const parsedReport = ReportParser.parseMarkdownReport(reportContent);
            yPosition = this.addParsedContentToPDF(doc, parsedReport, yPosition, margin, contentWidth);
        } else {
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text('Detailed report not available.', margin, yPosition);
            yPosition += 10;
        }

        return yPosition;
    },

    addParsedContentToPDF(doc, parsedReport, yPosition, margin, contentWidth) {
        // Add title and description
        if (parsedReport.title) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(parsedReport.title, margin, yPosition);
            yPosition += 8;
        }

        if (parsedReport.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const descriptionLines = doc.splitTextToSize(parsedReport.description, contentWidth);
            doc.text(descriptionLines, margin, yPosition);
            yPosition += (descriptionLines.length * 5) + 10;
        }

        // Add key characteristics
        if (parsedReport.keyCharacteristics.length > 0) {
            yPosition = this.addSectionToPDF(
                doc, 
                'Key Characteristics', 
                parsedReport.keyCharacteristics, 
                yPosition, 
                margin, 
                contentWidth
            );
        }

        // Add other sections
        const sections = [
            { key: 'dailyImpact', title: 'Daily Impact' },
            { key: 'developmentStrategy', title: 'Development Strategy' },
            { key: 'recommendedExercises', title: 'Recommended Exercises' }
        ];

        for (const section of sections) {
            if (parsedReport[section.key].length > 0) {
                yPosition = this.addSectionToPDF(
                    doc, 
                    section.title, 
                    parsedReport[section.key], 
                    yPosition, 
                    margin, 
                    contentWidth
                );
            }
        }

        return yPosition;
    },

    addSectionToPDF(doc, sectionTitle, items, yPosition, margin, contentWidth) {
        // Check if we need a new page
        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
        }

        // Section header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text(sectionTitle, margin, yPosition);
        yPosition += 8;

        // Section items
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        for (const item of items) {
            // Check if we need a new page for this item
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }

            const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
            doc.text(lines, margin + 5, yPosition);
            yPosition += (lines.length * 5) + 2;
        }

        yPosition += 5; // Space after section
        return yPosition;
    },

    addActionPlan(doc, results, margin, contentWidth) {
        let yPosition = 20;

        // Page title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text('Your 30-Day Growth Plan', margin, yPosition);
        yPosition += 25;

        // Find focus area (lowest score)
        let lowestCategory = '';
        let lowestScore = 5;
        for (const [category, result] of Object.entries(results)) {
            if (result.overall < lowestScore) {
                lowestScore = result.overall;
                lowestCategory = category;
            }
        }

        // Action plan items
        const actionPlan = [
            'Daily: Practice 5 minutes of mindfulness meditation',
            'Weekly: Set one learning goal and track progress',
            'Bi-weekly: Review and reflect on your growth',
            `Monthly: Focus on improving your ${lowestCategory} skills`,
            'Continuous: Apply insights from this assessment in daily life'
        ];

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        for (const action of actionPlan) {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }

            const lines = doc.splitTextToSize(`• ${action}`, contentWidth);
            doc.text(lines, margin, yPosition);
            yPosition += (lines.length * 6) + 5;
        }

        // Final encouragement
        yPosition += 10;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text('Remember: Growth is a journey, not a destination.', margin, yPosition);
    }
};