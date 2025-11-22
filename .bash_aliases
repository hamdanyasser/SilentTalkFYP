# SilentTalk - Bash Aliases for Quick Access
# Add these to your ~/.bashrc or ~/.bash_aliases

alias silent-start='cd ~/SilentTalkFYP && ./quick-start.sh'
alias silent-stop='cd ~/SilentTalkFYP && ./stop-all-services.sh'
alias silent-status='cd ~/SilentTalkFYP && ./check-services.sh'
alias silent-restart='cd ~/SilentTalkFYP && ./stop-all-services.sh && sleep 3 && ./quick-start.sh'
alias silent-logs-backend='tail -f ~/SilentTalkFYP/server/backend.log'
alias silent-logs-frontend='tail -f ~/SilentTalkFYP/client/frontend.log'
alias silent-logs-ml='tail -f ~/SilentTalkFYP/ml-service/ml-service.log'
alias silent-open='xdg-open http://localhost:3001 || open http://localhost:3001'
