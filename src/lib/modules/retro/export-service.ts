import {
  RetroWithDetails,
  RetroNoteWithAuthor,
  RetroColumn,
  RETRO_COLUMNS,
} from "./types";

export interface ExportOptions {
  includeVotes?: boolean;
  includeAuthor?: boolean;
  includeTimestamps?: boolean;
  groupByColumn?: boolean;
}

export interface NotionExportOptions {
  pageId?: string;
  databaseId?: string;
  includeVotes?: boolean;
}

export class RetroExportService {
  /**
   * Export retro to Markdown format
   */
  static exportToMarkdown(
    retro: RetroWithDetails,
    notes: RetroNoteWithAuthor[],
    options: ExportOptions = {},
  ): string {
    const {
      includeVotes = true,
      includeAuthor = false,
      includeTimestamps = false,
      groupByColumn = true,
    } = options;

    let markdown = `# ${retro.title}\n\n`;

    // Add metadata
    if (retro.sprint) {
      markdown += `**Sprint:** ${retro.sprint}\n\n`;
    }

    markdown += `**Date:** ${new Date(
      retro.created_at,
    ).toLocaleDateString()}\n`;
    markdown += `**Status:** ${retro.status}\n`;

    if (retro.created_by_member) {
      markdown += `**Created by:** ${
        retro.created_by_member.github_login || retro.created_by_member.email
      }\n`;
    }

    markdown += `\n---\n\n`;

    if (groupByColumn) {
      // Group notes by column
      const notesByColumn = this.groupNotesByColumn(notes);

      Object.entries(RETRO_COLUMNS).forEach(([columnKey, columnConfig]) => {
        const columnNotes = notesByColumn[columnKey as RetroColumn] || [];

        markdown += `## ${columnConfig.title}\n\n`;

        if (columnNotes.length === 0) {
          markdown += `*No items*\n\n`;
        } else {
          // Sort by votes (descending) then by creation time
          const sortedNotes = columnNotes.sort((a, b) => {
            if (b.votes !== a.votes) {
              return b.votes - a.votes;
            }
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          });

          sortedNotes.forEach((note, index) => {
            markdown += `${index + 1}. ${note.text}`;

            const metadata: string[] = [];

            if (includeVotes && note.votes > 0) {
              metadata.push(`${note.votes} vote${note.votes !== 1 ? "s" : ""}`);
            }

            if (includeAuthor && note.author && !note.is_anonymous) {
              metadata.push(
                `by ${note.author.github_login || note.author.email}`,
              );
            }

            if (includeTimestamps) {
              metadata.push(`${new Date(note.created_at).toLocaleString()}`);
            }

            if (metadata.length > 0) {
              markdown += ` *(${metadata.join(", ")})*`;
            }

            markdown += `\n`;
          });

          markdown += `\n`;
        }
      });
    } else {
      // List all notes chronologically
      markdown += `## All Notes\n\n`;

      const sortedNotes = notes.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      sortedNotes.forEach((note, index) => {
        const columnTitle = RETRO_COLUMNS[note.column_key].title;
        markdown += `${index + 1}. **[${columnTitle}]** ${note.text}`;

        const metadata: string[] = [];

        if (includeVotes && note.votes > 0) {
          metadata.push(`${note.votes} vote${note.votes !== 1 ? "s" : ""}`);
        }

        if (includeAuthor && note.author && !note.is_anonymous) {
          metadata.push(`by ${note.author.github_login || note.author.email}`);
        }

        if (includeTimestamps) {
          metadata.push(`${new Date(note.created_at).toLocaleString()}`);
        }

        if (metadata.length > 0) {
          markdown += ` *(${metadata.join(", ")})*`;
        }

        markdown += `\n`;
      });
    }

    // Add summary statistics
    const stats = this.calculateStats(notes);
    markdown += `\n---\n\n## Summary\n\n`;
    markdown += `- **Total Notes:** ${stats.totalNotes}\n`;
    markdown += `- **Total Votes:** ${stats.totalVotes}\n`;
    markdown += `- **Notes by Column:**\n`;

    Object.entries(RETRO_COLUMNS).forEach(([columnKey, columnConfig]) => {
      const count = stats.notesByColumn[columnKey as RetroColumn];
      markdown += `  - ${columnConfig.title}: ${count}\n`;
    });

    return markdown;
  }

  /**
   * Export retro to Notion (feature flagged)
   */
  static async exportToNotion(
    retro: RetroWithDetails,
    notes: RetroNoteWithAuthor[],
    notionToken: string,
    options: NotionExportOptions = {},
  ): Promise<{ success: boolean; pageUrl?: string; error?: string }> {
    try {
      // This is a stretch goal implementation
      // In a real implementation, you would use the Notion API

      if (!notionToken) {
        throw new Error("Notion token is required");
      }

      // Mock implementation for demo purposes
      // In production, this would integrate with @notionhq/client
      const mockPageUrl = `https://notion.so/retro-${retro.id}`;

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        pageUrl: mockPageUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Merge duplicate notes based on similarity
   */
  static mergeDuplicateNotes(
    notes: RetroNoteWithAuthor[],
    similarityThreshold: number = 0.8,
  ): {
    mergedNotes: RetroNoteWithAuthor[];
    duplicateGroups: RetroNoteWithAuthor[][];
  } {
    const mergedNotes: RetroNoteWithAuthor[] = [];
    const duplicateGroups: RetroNoteWithAuthor[][] = [];
    const processed = new Set<string>();

    for (const note of notes) {
      if (processed.has(note.id)) continue;

      const similarNotes = notes.filter(
        (otherNote) =>
          !processed.has(otherNote.id) &&
          otherNote.column_key === note.column_key &&
          this.calculateSimilarity(note.text, otherNote.text) >=
            similarityThreshold,
      );

      if (similarNotes.length > 1) {
        // Found duplicates - merge them
        const mergedNote = this.mergeNotes(similarNotes);
        mergedNotes.push(mergedNote);
        duplicateGroups.push(similarNotes);

        similarNotes.forEach((n) => processed.add(n.id));
      } else {
        // No duplicates found
        mergedNotes.push(note);
        processed.add(note.id);
      }
    }

    return { mergedNotes, duplicateGroups };
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1.0;

    // Normalize text: lowercase, remove punctuation, split on whitespace
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, "") // Remove punctuation
        .split(/\s+/)
        .filter((word) => word.length > 0);

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word)),
    );
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Merge multiple notes into one
   */
  private static mergeNotes(notes: RetroNoteWithAuthor[]): RetroNoteWithAuthor {
    // Use the note with the most votes as the base
    const baseNote = notes.reduce((prev, current) =>
      current.votes > prev.votes ? current : prev,
    );

    // Combine votes from all notes
    const totalVotes = notes.reduce((sum, note) => sum + note.votes, 0);

    // Combine text if significantly different
    const uniqueTexts = [...new Set(notes.map((n) => n.text))];
    const mergedText =
      uniqueTexts.length > 1 ? uniqueTexts.join(" / ") : baseNote.text;

    return {
      ...baseNote,
      text: mergedText,
      votes: totalVotes,
    };
  }

  /**
   * Group notes by column
   */
  private static groupNotesByColumn(
    notes: RetroNoteWithAuthor[],
  ): Record<RetroColumn, RetroNoteWithAuthor[]> {
    const grouped: Record<RetroColumn, RetroNoteWithAuthor[]> = {
      went_well: [],
      went_poorly: [],
      ideas: [],
      action_items: [],
    };

    notes.forEach((note) => {
      grouped[note.column_key].push(note);
    });

    return grouped;
  }

  /**
   * Calculate statistics for notes
   */
  private static calculateStats(notes: RetroNoteWithAuthor[]): {
    totalNotes: number;
    totalVotes: number;
    notesByColumn: Record<RetroColumn, number>;
  } {
    const stats = {
      totalNotes: notes.length,
      totalVotes: notes.reduce((sum, note) => sum + note.votes, 0),
      notesByColumn: {
        went_well: 0,
        went_poorly: 0,
        ideas: 0,
        action_items: 0,
      } as Record<RetroColumn, number>,
    };

    notes.forEach((note) => {
      stats.notesByColumn[note.column_key]++;
    });

    return stats;
  }
}
