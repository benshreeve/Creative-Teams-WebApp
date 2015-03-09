
# Author: Habib Naderi
# Department of Computer Science, University of Auckland
# 
# This Python program facilitates administrative operations for creative teams application. Using this program,
# an administrator can create new teams, delete/reset existing teams, zap mysql and redis db and view redis db 
# information via a command-line interface. 
 


import redis
import MySQLdb
import shutil
import os
from optparse import OptionParser
import sys
import json

mysql_host='localhost'
redis_host='localhost'

def usage():
    print 'usage: python '+ sys.argv[0]+ \
          ' -c <command> [-t <team-ID>] [-u <user-ID>] [-m <mysql-host>] [-r <redis-host>][-h]\n'
    print 'commands:'
    print '\tget [-t <team-ID>]: Prints information in REDIS DB. Team-ID can be specified.'
    print '\treset -t team-ID: Resets a team. Record in REDIS is reset to initial values and results and transactions are removed from MYSQL DB and file system.'
    print '\tdelteam -t team-ID: Deletes a team. Team members and all records and results belong to this team is removed from both DBs and also file system.'
    print '\tdelsession [-t team-ID] [-u user-ID]: Deletes session(s) belong to a user or set of users from redis DB.'
    print '\tzapmysql: Truncates MySQL DB. users and config tables remain untouched.'
    print '\tzapredis: Truncates REDIS DB. All team and session records are removed.'
    print '\tenable [-t <team-ID>] [-u <user-ID>]: Enables a user or a set of users. Team-ID and User-ID can be specified.'
    print '\tdisable [-t <team-ID>] [-u <user-ID>]: Disables a user  or a set of users. Team-ID and User-ID can be specified.'
    print '\tdeactivate [-t <team-ID>] [-u <user-ID>]: Deactivates a user or a set of users so that user(s) can log in to the system again. Team-ID and User-ID can be specified.'
    print '\ttime -t <team-ID> -e <test-ID>: prints how much time the team has spent on the test. '
    print '-m/-r:'
    print '\tmysql-host: IP/name of the MYSQL server. default is localhost.'
    print '\tredis-host: IP/name of the REDIS server. default is localhost.'
    print
    print 'example: python -c get -t 1  --> prints the record, in REDIS DB, for team 1.'
    print '         python -c reset -t 1  --> resets the status for team 1. You might need to run it with sudo to remove results from file system.'
    print '         python -c zapmyql   --> removes all records from MySQL DB tables except for users and config.'
    print '         python -c deactivate -t 1 -u 1   --> deactivates user 1 in team 1 (access code: s1p1).'
    print '         python -c delsession -t 1 --> removes all session records for team 1 members from redis DB.'
    print

def print_team_record(teamID, teamInfo):
    print "\nRecord for Team ", teamID
    for key in teamInfo:
        print "\t", key, ":", teamInfo[key]
    print

def print_redis_records():
        for key in rdb.scan_iter():
            try:
                print_team_record(key, rdb.hgetall(key))
            except:
                print rdb.get(key)


def reset_redis_record(teamID):
    print "resetting record in redis DB for team", teamID
    teamInfo = rdb.hgetall(teamID)
    teamInfo['CurrentTest'] = 0;
    teamInfo['CurrentScreen'] = 0;
    teamInfo['TextEditingUser'] = ''
    teamInfo['StartTime'] = 9999
    teamInfo['TestTime'] = 0
    teamInfo['IdeaId'] = 1
    teamInfo['Participants'] = ''
    teamInfo['ReadyToStart'] = ''
    teamInfo['PicConBGCreator'] = ''
    teamInfo['PicConBGImage'] = ''
    teamInfo['DemoStopTimer'] = 1
    rdb.hmset(teamID, teamInfo)

def delete_results_from_DB(teamID):
    print "removing results and transactions from mysql DB for team", teamID
    cur.execute('delete from  altusesres where TeamID='+teamID)
    cur.execute('delete from  ideagenres where TeamID='+teamID)
    cur.execute('delete from  deschalres where TeamID='+teamID)
    cur.execute('delete from  parlinesres where TeamID='+teamID)
    cur.execute('delete from  participation where TeamID='+teamID)
    cur.execute('delete from  piccompres where TeamID='+teamID)
    cur.execute('delete from  picconres where TeamID='+teamID)
    cur.execute('delete from  transactions where TeamID='+teamID)
    db.commit()

def delete_results_from_fs(teamID):
    cur.execute('select ResultsPath from config')
    folder = os.path.join(cur.fetchall()[0][0], options.teamID)
    print "removing results folder: ", folder
    if os.path.exists(folder):
        shutil.rmtree(folder)
    else:
        print "\t"+folder+" does not exist!"
        
def delete_piccon_bg(teamID):
    info = rdb.hgetall(options.teamID)
    if info.has_key('PicConBgImage') and info['PicConBGImage'] != None and info['PicConBGImage'] != '':
        os.remove(os.path.join('../images/pictureconstruction', info['PicConBGImage']))            

def zap_mysql_db():
    cur.execute('TRUNCATE altusesres')
    cur.execute('TRUNCATE deschalres')
    cur.execute('TRUNCATE ideagenres')
    cur.execute('TRUNCATE parlinesres')
    cur.execute('TRUNCATE participation')
    cur.execute('TRUNCATE piccompres')
    cur.execute('TRUNCATE picconres')
    cur.execute('TRUNCATE transactions')
    cur.execute('update users set Active=0')
    db.commit()

def deactivate_user(teamID, userID):
    if (teamID == None):
        if (userID == None):
            cur.execute('update users set Active=0')
        else:
            cur.execute('update users set Active=0 where UserID='+userID)
    else:
        if (userID == None):
            cur.execute('update users set Active=0 where TeamID='+teamID)
        else:
            cur.execute('update users set Active=0 where TeamID='+teamID+' and UserID='+userID)
    db.commit()

def disable_user(teamID, userID):
    if (teamID == None):
        if (userID == None):
            cur.execute('update users set Enabled=0')
        else:
            cur.execute('update users set Enabled=0 where UserID='+userID)
    else:
        if (userID == None):
            cur.execute('update users set Enabled=0 where TeamID='+teamID)
        else:
            cur.execute('update users set Enabled=0 where TeamID='+teamID+' and UserID='+userID)
    db.commit()


def enable_user(teamID, userID):
    if (teamID == None):
        if (userID == None):
            cur.execute('update users set Enabled=1')
        else:
            cur.execute('update users set Enabled=1 where UserID='+userID)
    else:
        if (userID == None):
            cur.execute('update users set Enabled=1 where TeamID='+teamID)
        else:
            cur.execute('update users set Enabled=1 where TeamID='+teamID+' and UserID='+userID)
    db.commit()

def delete_user(teamID, userID):
    if (teamID == None):
        if (userID == None):
            cur.execute('delete from users')
        else:
            cur.execute('delete from users where UserID='+userID)
    else:
        if (userID == None):
            cur.execute('delete from users where TeamID='+teamID)
        else:
            cur.execute('delete from users where TeamID='+teamID+' and UserID='+userID)
    db.commit()


def create_team(teamID):
    cur.execute('select * from users where TeamID='+teamID)
    if cur.rowcount > 0:
        print "Team", teamID, "already exists"
    else:
        cur.execute('insert into users values ('+teamID+',1,"",0,1)')
        cur.execute('insert into users values ('+teamID+',2,"",0,1)')
        cur.execute('insert into users values ('+teamID+',3,"",0,1)')
        db.commit()

def delete_team(teamID):
    rdb.delete(teamID)
    delete_results_from_DB(teamID)
    delete_results_from_fs(teamID)
    delete_user(teamID, None)
    delete_piccon_bg(teamID)

def reset_team(teamID):
    rdb.delete(teamID)
    delete_results_from_DB(teamID)
    delete_results_from_fs(teamID)
    delete_piccon_bg(teamID)    

def zap_redis_db():
    rdb.flushdb()

def delete_session(teamID, userID):
    for key in rdb.scan_iter():
        try:
            v = json.loads(rdb.get(key))
            if (teamID == None):
                if (userID == None):
                    rdb.delete(key)
                else:
                    if (v.hasKey('UserID') and v['UserID'] == int(userID)):
                        rdb.delete(key)
            else:
                if (userID == None):
                    if (v.has_key('TeamID') and v['TeamID'] == int(teamID)):
                        rdb.delete(key)
                else:
                    if (v.has_key('TeamID') and v['TeamID'] == int(teamID) and v.has_key('UserID') and v['UserID'] == int(userID)):
                        rdb.delete(key)

        except:
                v= None
                
def calculate_test_time(teamID, testID):
    cur.execute("select time from transactions where TeamID="+teamID+" and TestID="+testID+" order by time asc limit 1")
    if cur.rowcount > 0:
        first = cur.fetchall()[0][0]
        cur.execute("select time from transactions where TeamID="+teamID+" and TestID="+testID+" order by time desc limit 1")
        last = cur.fetchall()[0][0]
        print "time spent in this test:", float(last-first)/1000, "seconds"
    else:
        print "no record for this team and test."                

def check_options(options):
    global mysql_host, redis_host
    if options.cmd == None:
        print "no command specified"
        return False
    if  (options.cmd == 'reset' or options.cmd == 'delete' or options.cmd == 'create') and options.teamID == None:
        print "Team-ID required"
        return False
    if options.mysql_host != None:
        mysql_host = options.mysql_host
    if options.redis_host != None:
        redis_host = options.redis_host
    return True


parser = OptionParser()
parser.add_option("-t", "--team", dest="teamID")
parser.add_option("-c", "--command", dest="cmd")
parser.add_option("-u", "--user", dest="userID")
parser.add_option("-e", "--test", dest="testID")
parser.add_option("-m", "--mysql-host", dest="mysql_host")
parser.add_option("-r", "--redis-host", dest="redis_host")


(options, args) = parser.parse_args()

if not check_options(options):
    usage()
    sys.exit()

rdb = redis.StrictRedis(host=redis_host, port=13163, password='apple')
db = MySQLdb.connect(host=mysql_host, user='b935b086008866', passwd='1b01c493', db='creativeteams')
cur = db.cursor()

if options.cmd == 'get':
    if options.teamID != None:
        print_team_record(options.teamID, rdb.hgetall(options.teamID))
    else:
        print_redis_records()
elif options.cmd == 'reset':
    reset_team(options.teamID)
elif options.cmd == 'delteam':
    delete_team(options.teamID)
elif options.cmd == 'delsession':
    delete_session(options.teamID, options.userID)
elif options.cmd == 'zapmysql':
    zap_mysql_db()
elif options.cmd == 'deactivate':
    deactivate_user(options.teamID, options.userID)
elif options.cmd == 'disable':
    disable_user(options.teamID, options.userID)
elif options.cmd == 'enable':
    enable_user(options.teamID, options.userID)
elif options.cmd == 'create':
    create_team(options.teamID)
elif options.cmd == 'zapredis':
    zap_redis_db()
elif options.cmd == 'time':
    calculate_test_time(options.teamID, options.testID)    
else:
    print 'invalid command: ', options.cmd

	
cur.close()
db.close()
