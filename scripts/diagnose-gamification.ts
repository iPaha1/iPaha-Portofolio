// scripts/diagnose-gamification.ts - Fixed
import { prismadb } from "@/lib/db";

async function diagnoseGamification() {
  console.log("🔍 Diagnosing gamification issues...\n");
  
  // Check users
  const users = await prismadb.user.findMany({
    select: {
      id: true,
      clerkId: true,
      email: true,
      displayName: true,
      isActive: true,
    },
  });
  
  console.log(`📊 Found ${users.length} users in database:`);
  users.forEach(u => {
    console.log(`   - ${u.displayName} (${u.email}): ID=${u.id}, Active=${u.isActive}`);
  });
  
  // Check wallets
  const wallets = await prismadb.tokenWallet.findMany({
    include: { user: true },
  });
  
  console.log(`\n💰 Found ${wallets.length} wallets:`);
  wallets.forEach(w => {
    console.log(`   - User: ${w.user?.displayName || 'Unknown'}, Balance: ${w.balance}, ID: ${w.userId}`);
  });
  
  // Check game settings
  const settings = await prismadb.gameSettings.findMany({
    include: { user: true },
  });
  
  console.log(`\n🎮 Found ${settings.length} game settings:`);
  settings.forEach(s => {
    console.log(`   - User: ${s.user?.displayName || 'Unknown'}, Enabled: ${s.gameEnabled}, ID: ${s.userId}`);
  });
  
  // Check for any recent game events
  const recentGames = await prismadb.gameEvent.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      participations: true,
    },
  });
  
  console.log(`\n🎲 Recent game events (last 5):`);
  if (recentGames.length === 0) {
    console.log("   No game events found. Games haven't been triggered yet.");
  } else {
    recentGames.forEach(g => {
      console.log(`   - ${g.title}: ${g.type}, Reward: ${g.rewardTokens}, Active: ${g.isActive}`);
      console.log(`     Participations: ${g.participations.length}`);
    });
  }
  
  // Get the active user's clerkId for testing
  const activeUser = users.find(u => u.isActive && u.email.includes("ike4football2"));
  if (activeUser && activeUser.clerkId) {
    console.log(`\n📝 To test with user: ${activeUser.displayName}`);
    console.log(`   User DB ID: ${activeUser.id}`);
    console.log(`   Clerk ID: ${activeUser.clerkId}`);
  }
  
  console.log(`\n✅ Diagnosis complete!`);
}

diagnoseGamification()
  .catch(console.error)
  .finally(() => process.exit(0));