import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and verify they're an admin
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("org_id, role")
      .eq("email", user.email!)
      .eq("deleted_at", null)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create demo members
    const demoMembers = [
      {
        org_id: member.org_id,
        email: "alice.demo@example.com",
        github_login: "alice-dev",
        github_id: "demo-12345",
        avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
        role: "member" as const,
      },
      {
        org_id: member.org_id,
        email: "bob.demo@example.com",
        github_login: "bob-coder",
        github_id: "demo-67890",
        avatar_url: "https://avatars.githubusercontent.com/u/67890?v=4",
        role: "member" as const,
      },
    ];

    const { data: createdMembers, error: membersError } = await supabase
      .from("members")
      .upsert(demoMembers, { onConflict: "org_id,email" })
      .select();

    if (membersError) {
      console.error("Error creating demo members:", membersError);
      return NextResponse.json(
        { error: "Failed to create demo members" },
        { status: 500 },
      );
    }

    // Create demo standups
    const today = new Date().toISOString().split("T")[0];
    const standups = [
      {
        org_id: member.org_id,
        member_id: createdMembers[0].id,
        date: today,
        yesterday: [
          "Completed user authentication feature",
          "Fixed bug in dashboard component",
          "Reviewed 2 pull requests",
        ],
        today: [
          "Working on API integration",
          "Planning sprint retrospective",
          "Code review session at 2pm",
        ],
        blockers: [],
      },
      {
        org_id: member.org_id,
        member_id: createdMembers[1].id,
        date: today,
        yesterday: [
          "Implemented new UI components",
          "Updated documentation",
          "Fixed test failures",
        ],
        today: [
          "Working on database optimization",
          "Team standup at 10am",
          "Deploy to staging environment",
        ],
        blockers: ["Waiting for API documentation"],
      },
    ];

    const { error: standupsError } = await supabase
      .from("standups")
      .upsert(standups, { onConflict: "org_id,member_id,date" });

    if (standupsError) {
      console.error("Error creating demo standups:", standupsError);
    }

    // Create demo PR insights
    const prInsights = [
      {
        org_id: member.org_id,
        repo: "demo-org/frontend",
        number: 123,
        author_member_id: createdMembers[0].id,
        additions: 245,
        deletions: 67,
        files_changed: 8,
        tests_changed: 3,
        touched_paths: [
          "src/components/Dashboard.tsx",
          "src/pages/api/auth.ts",
        ],
        size_score: 6.5,
        risk_score: 4.2,
        suggested_reviewers: ["bob-coder"],
        status: "open" as const,
        opened_at: new Date().toISOString(),
      },
      {
        org_id: member.org_id,
        repo: "demo-org/backend",
        number: 456,
        author_member_id: createdMembers[1].id,
        additions: 89,
        deletions: 23,
        files_changed: 4,
        tests_changed: 2,
        touched_paths: [
          "src/services/auth.service.ts",
          "src/controllers/user.controller.ts",
        ],
        size_score: 3.8,
        risk_score: 2.1,
        suggested_reviewers: ["alice-dev"],
        status: "open" as const,
        opened_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { error: prError } = await supabase
      .from("pr_insights")
      .upsert(prInsights, { onConflict: "org_id,repo,number" });

    if (prError) {
      console.error("Error creating demo PR insights:", prError);
    }

    // Create demo retro
    const { data: retro, error: retroError } = await supabase
      .from("retros")
      .upsert(
        {
          org_id: member.org_id,
          title: "Sprint 23 Retrospective",
          sprint: "Sprint 23",
          status: "active",
          created_by: member.org_id, // Use current user as creator
        },
        { onConflict: "org_id,title" },
      )
      .select()
      .single();

    if (retroError) {
      console.error("Error creating demo retro:", retroError);
    } else {
      // Create demo retro notes
      const retroNotes = [
        {
          retro_id: retro.id,
          author_member_id: createdMembers[0].id,
          column_key: "went_well" as const,
          text: "Great collaboration on the new feature",
          color: "#10b981",
          votes: 3,
        },
        {
          retro_id: retro.id,
          author_member_id: createdMembers[1].id,
          column_key: "went_well" as const,
          text: "Improved our testing coverage significantly",
          color: "#3b82f6",
          votes: 2,
        },
        {
          retro_id: retro.id,
          author_member_id: createdMembers[0].id,
          column_key: "went_poorly" as const,
          text: "Communication gaps during deployment",
          color: "#ef4444",
          votes: 1,
        },
        {
          retro_id: retro.id,
          author_member_id: createdMembers[1].id,
          column_key: "ideas" as const,
          text: "Implement automated deployment pipeline",
          color: "#8b5cf6",
          votes: 4,
        },
      ];

      const { error: notesError } = await supabase
        .from("retro_notes")
        .upsert(retroNotes, { onConflict: "retro_id,text" });

      if (notesError) {
        console.error("Error creating demo retro notes:", notesError);
      }
    }

    return NextResponse.json({
      message: "Demo data seeded successfully",
      members: createdMembers.length,
    });
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
