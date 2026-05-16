import mysql.connector
from faker import Faker
import random
import uuid
import json

fake = Faker()

CHAMPIONS = [
    'Aatrox', 'Ahri', 'Akali', 'Alistar', 'Amumu', 'Anivia', 'Annie', 'Aphelios', 'Ashe', 
    'AurelionSol', 'Azir', 'Bard', 'Belveth', 'Blitzcrank', 'Brand', 'Braum', 'Caitlyn', 
    'Camille', 'Cassiopeia', 'Chogath', 'Corki', 'Darius', 'Diana', 'Draven', 'DrMundo', 
    'Ekko', 'Elise', 'Evelynn', 'Ezreal', 'Fiddlesticks', 'Fiora', 'Fizz', 'Galio', 
    'Gangplank', 'Garen', 'Gnar', 'Gragas', 'Graves', 'Gwen', 'Hecarim', 'Heimerdinger', 
    'Illaoi', 'Irelia', 'Ivern', 'Janna', 'JarvanIV', 'Jax', 'Jayce', 'Jhin', 'Jinx', 
    'Kaisa', 'Kalista', 'Karma', 'Karthus', 'Kassadin', 'Katarina', 'Kayle', 'Kayn', 
    'Kennen', 'Khazix', 'Kindred', 'Kled', 'KogMaw', 'KSante', 'Leblanc', 'LeeSin', 
    'Leona', 'Lillia', 'Lissandra', 'Lucian', 'Lulu', 'Lux', 'Malphite', 'Malzahar', 
    'Maokai', 'MasterYi', 'MissFortune', 'MonkeyKing', 'Mordekaiser', 'Morgana', 'Nami', 
    'Nasus', 'Nautilus', 'Neeko', 'Nidalee', 'Nilah', 'Nocturne', 'Nunu', 'Olaf', 
    'Orianna', 'Ornn', 'Pantheon', 'Poppy', 'Pyke', 'Qiyana', 'Quinn', 'Rakan', 'Rammus', 
    'RekSai', 'Rell', 'Renata', 'Renekton', 'Rengar', 'Riven', 'Rumble', 'Ryze', 'Samira', 
    'Sejuani', 'Senna', 'Seraphine', 'Sett', 'Shaco', 'Shen', 'Shyvana', 'Singed', 
    'Sion', 'Sivir', 'Skarner', 'Sona', 'Soraka', 'Swain', 'Sylas', 'Syndra', 'TahmKench', 
    'Taliyah', 'Talon', 'Taric', 'Teemo', 'Thresh', 'Tristana', 'Trundle', 'Tryndamere', 
    'TwistedFate', 'Twitch', 'Udyr', 'Urgot', 'Varus', 'Vayne', 'Veigar', 'Velkoz', 'Vex', 
    'Vi', 'Viego', 'Viktor', 'Vladimir', 'Volibear', 'Warwick', 'Xayah', 'Xerath', 
    'XinZhao', 'Yasuo', 'Yone', 'Yorick', 'Yuumi', 'Zac', 'Zed', 'Zeri', 'Ziggs', 
    'Zilean', 'Zoe', 'Zyra'
]

REGIONS = ['EUW1', 'EUN1', 'NA1', 'KR', 'BR1', 'JP1', 'LA1', 'LA2', 'OC1', 'RU', 'TR1']
POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']
TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']
RANK_DIVISIONS = ['I', 'II', 'III', 'IV']

QUEUES = [
    (420, 'CLASSIC', 'MATCHED_GAME'), # Ranked Solo/Duo
    (440, 'CLASSIC', 'MATCHED_GAME'), # Ranked Flex
    (400, 'CLASSIC', 'MATCHED_GAME'), # Draft Pick
    (430, 'CLASSIC', 'MATCHED_GAME'), # Blind Pick
    (450, 'ARAM', 'MATCHED_GAME')     # ARAM
]

db = mysql.connector.connect(
    host='mysql', 
    user='root', 
    password='testa_parole_123', 
    database='lol_page'
)
cursor = db.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS ranked_stats (
    summonerId VARCHAR(80),
    queueType VARCHAR(50),
    tier VARCHAR(20),
    rank_tier VARCHAR(10),
    leaguePoints INT,
    wins INT,
    losses INT,
    miniSeries JSON
)
""")
db.commit()

summoners_batch = []
ranked_stats_batch = []
matches_batch = []

def generate_mini_series(rank_div):
    """Ģenerē Promotion sērijas spēlētājiem, kuriem ir 100 LP."""
    target = 3 if rank_div == 'I' else 2
    p_wins = random.randint(0, target - 1)
    p_losses = random.randint(0, target - 1)
    progress = ("W" * p_wins) + ("L" * p_losses) + ("N" * (target * 2 - 1 - p_wins - p_losses))
    return json.dumps({
        "target": target,
        "wins": p_wins,
        "losses": p_losses,
        "progress": progress
    })

print("Sākam datu ģenerēšanu... Šis process var aizņemt minūti.")

PLAYERS_PER_REGION = 100
MATCHES_PER_PLAYER = 250

for region in REGIONS:
    for i in range(1, PLAYERS_PER_REGION + 1):
        puuid = str(uuid.uuid4())
        name = f"{fake.word().capitalize()}test{i}"[:16]
        account_id = str(uuid.uuid4())[:56]
        s_id = str(uuid.uuid4())[:80]
        profile_icon = random.randint(1, 5000)
        summoner_level = random.randint(30, 800)

        summoners_batch.append((puuid, name, profile_icon, summoner_level, account_id, region, s_id))

        for queue_type in ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR']:
            tier = random.choice(TIERS)
            rank_div = 'I' if tier in ['MASTER', 'GRANDMASTER', 'CHALLENGER'] else random.choice(RANK_DIVISIONS)
            lp = random.randint(0, 100)
            wins = random.randint(20, 300)
            losses = random.randint(20, 300)
            mini_series = generate_mini_series(rank_div) if lp == 100 else None
            
            ranked_stats_batch.append((s_id, queue_type, tier, rank_div, lp, wins, losses, mini_series))

        for _ in range(MATCHES_PER_PLAYER):
            match_id = f'{region}_{fake.random_number(digits=10)}'
            queue_id, game_mode, game_type = random.choice(QUEUES)
            
            pos = 'NONE' if queue_id == 450 else random.choice(POSITIONS)
            champion = random.choice(CHAMPIONS)
            win = random.choice([0, 1])

            matches_batch.append((puuid, match_id, champion, pos, win, game_mode, game_type, queue_id))

    print(f"[{region}] Sagatavoti {PLAYERS_PER_REGION} spēlētāji un {PLAYERS_PER_REGION * MATCHES_PER_PLAYER} mači.")

print("\nSaglabājam datus datubāzē (Tas prasīs nedaudz laika)...")

cursor.executemany('''
    INSERT INTO summoners (puuid, name, profileIconId, summonerLevel, accountId, region, id) 
    VALUES (%s, %s, %s, %s, %s, %s, %s)
''', summoners_batch)

cursor.executemany('''
    INSERT INTO ranked_stats (summonerId, queueType, tier, rank_tier, leaguePoints, wins, losses, miniSeries) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
''', ranked_stats_batch)

chunk_size = 10000
for i in range(0, len(matches_batch), chunk_size):
    cursor.executemany('''
        INSERT INTO matches (puuid, matchId, championName, teamPosition, win, gameMode, gameType, queueId) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ''', matches_batch[i:i+chunk_size])
    db.commit()

print(f"Datu ģenerācija pilnībā pabeigta! Izveidoti {len(summoners_batch)} spēlētāji un {len(matches_batch)} mači.")

cursor.close()
db.close()